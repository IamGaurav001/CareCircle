import { and, eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { AUTOMATIC_CHECK_ID, ensureAutomaticCheck } from "@/lib/automatic-check";
import { db } from "@/lib/db";
import { funds, reviews } from "@/lib/db/schema";
import { uploadAndRead } from "@/lib/documents";
import { getFund } from "@/lib/funds";
import { HttpError, route, uuidParam } from "@/lib/http";

// Gemini may need two tries (main model, then fallback), each up to 45 seconds.
export const maxDuration = 120;

// Family uploads the hospital's receipt. If the AI finds nothing wrong with it (it is from
// the hospital that was paid, and for this treatment), the fundraiser completes at once;
// otherwise the review team checks it.
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("family");
  const fund = await getFund(uuidParam((await params).id));
  if (fund.ownerId !== user.id) throw new HttpError(404, "Not found");
  if (fund.status !== "receipts_due") throw new HttpError(409, "Receipts are uploaded after the hospital has been paid");

  const { document, extraction } = await uploadAndRead(request, fund, user, "receipt");

  const acceptedAutomatically = extraction.flags.length === 0;
  if (acceptedAutomatically) {
    await db.transaction(async (tx) => {
      const [closed] = await tx
        .update(funds)
        .set({ status: "closed" })
        .where(and(eq(funds.id, fund.id), eq(funds.status, "receipts_due")))
        .returning({ id: funds.id });
      if (!closed) return;
      await ensureAutomaticCheck(tx);
      await tx.insert(reviews).values({
        fundId: fund.id,
        reviewerId: AUTOMATIC_CHECK_ID,
        stage: "receipts",
        decision: "approve",
        note: "The receipt is from the hospital that was paid, for this treatment.",
      });
    });
  }
  return Response.json({ documentId: document.id, extraction, acceptedAutomatically }, { status: 201 });
});
