import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents, funds } from "@/lib/db/schema";
import { HttpError, route, uuidParam } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";

// Opens an uploaded bill or receipt. Only the family that owns the fundraiser and
// reviewers may see it; the file stays in a private bucket and the link lasts a minute.
export const GET = route(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("family", "reviewer");
  const [row] = await db
    .select({ storagePath: documents.storagePath, ownerId: funds.ownerId })
    .from(documents)
    .innerJoin(funds, eq(funds.id, documents.fundId))
    .where(eq(documents.id, uuidParam((await params).id)));
  if (!row || (user.role === "family" && row.ownerId !== user.id)) throw new HttpError(404, "Not found");

  const signed = await createAdminClient().storage.from("documents").createSignedUrl(row.storagePath, 60);
  if (signed.error) throw new HttpError(404, "The file is no longer available");
  return NextResponse.redirect(signed.data.signedUrl);
});
