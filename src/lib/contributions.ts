import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contributions } from "@/lib/db/schema";
import { appendEntry } from "@/lib/ledger";

type Contribution = typeof contributions.$inferSelect;

/**
 * Records a completed PayPal capture: marks the contribution captured and adds its
 * ledger entry. Safe to call more than once; the capture route and the webhook both do.
 */
export async function recordCapture(contribution: Contribution, captureId: string, amountCents: number) {
  await db.transaction(async (tx) => {
    await tx
      .update(contributions)
      .set({ paypalCaptureId: captureId, status: "captured" })
      .where(eq(contributions.id, contribution.id));
    await appendEntry({ fundId: contribution.fundId, type: "contribution", amountCents, sourceRef: captureId }, tx);
  });
}
