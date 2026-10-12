import "server-only";
import { randomUUID } from "node:crypto";
import { readDocument } from "@/lib/ai/read-document";
import type { CurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { aiExtractions, documents } from "@/lib/db/schema";
import type { Fund } from "@/lib/funds";
import { looksLikeSameProvider } from "@/lib/funds/names";
import { HttpError } from "@/lib/http";
import { HOUR, withinLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 8 * 1024 * 1024; // the proxy buffers request bodies up to 10 MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/**
 * Stores an uploaded estimate or receipt in the private bucket, then has Gemini read it.
 * The document is kept even if reading fails, so the family can see it was received.
 */
export async function uploadAndRead(request: Request, fund: Fund, user: CurrentUser, kind: "estimate" | "receipt") {
  if (!(await withinLimit(`upload:${user.id}`, 20, HOUR))) {
    throw new HttpError(429, "Too many uploads in the last hour. Please try again later.");
  }
  const form = await request.formData().catch(() => {
    throw new HttpError(400, "Send the file as a form upload");
  });
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw new HttpError(400, "Choose a file to upload");
  if (file.size > MAX_BYTES) throw new HttpError(413, "The file is larger than 8 MB");
  if (!ALLOWED_TYPES.includes(file.type)) throw new HttpError(415, "Upload a PDF or a photo (JPEG, PNG, WebP or HEIC)");

  const data = Buffer.from(await file.arrayBuffer());
  const storagePath = `${fund.id}/${kind}-${randomUUID()}`;
  const stored = await createAdminClient().storage.from("documents").upload(storagePath, data, { contentType: file.type });
  if (stored.error) throw new HttpError(502, "Could not save the file. Please try again.");

  const [document] = await db
    .insert(documents)
    .values({ fundId: fund.id, kind, storagePath, uploadedBy: user.id })
    .returning();

  let reading;
  try {
    reading = await readDocument({ data, mimeType: file.type }, kind, fund.purpose);
  } catch (error) {
    console.error("Gemini could not read the document", error);
    throw new HttpError(502, "The file was saved, but the AI could not read it. Please upload it again, or a clearer copy.");
  }

  // A receipt should come from the hospital that was paid. Code compares the names; the reviewer decides.
  if (kind === "receipt") {
    if (!reading.providerName) {
      reading.flags.push({ kind: "other", message: "No hospital name was found on this receipt." });
    } else if (!looksLikeSameProvider(reading.providerName, fund.payeeName)) {
      reading.flags.push({
        kind: "other",
        message: `This receipt is from "${reading.providerName}", but the money was paid to "${fund.payeeName}".`,
      });
    }
  }

  const [extraction] = await db
    .insert(aiExtractions)
    .values({ documentId: document.id, ...reading })
    .returning();
  return { document, extraction };
}
