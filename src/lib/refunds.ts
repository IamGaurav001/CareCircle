import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { contributions } from "@/lib/db/schema";
import { appendEntry } from "@/lib/ledger";
import { paypalRequest } from "@/lib/paypal/client";

type Refund = { id: string; status: string };

/** Captured payments of a fund that have not been given back yet. */
export function unrefundedContributions(fundId: string) {
  return db
    .select()
    .from(contributions)
    .where(and(eq(contributions.fundId, fundId), eq(contributions.status, "captured"), isNull(contributions.paypalRefundId)));
}

/**
 * Gives every captured payment of a cancelled fund back to the person who paid it, in full.
 * Each refund uses the contribution's own request id, so running this again (after a
 * failure, or twice at once) never refunds the same payment twice.
 */
export async function refundAll(fundId: string): Promise<{ refunded: number; failed: number }> {
  let refunded = 0;
  let failed = 0;
  for (const contribution of await unrefundedContributions(fundId)) {
    if (!contribution.paypalCaptureId) continue;
    try {
      const refund = await paypalRequest<Refund>(`/v2/payments/captures/${contribution.paypalCaptureId}/refund`, {
        method: "POST",
        requestId: `refund-${contribution.id}`,
        body: { note_to_payer: "CareCircle: this fundraiser was cancelled, so your payment is returned in full." },
      });
      if (refund.status !== "COMPLETED" && refund.status !== "PENDING") throw new Error(`Refund status ${refund.status}`);
      await db.transaction(async (tx) => {
        await tx
          .update(contributions)
          .set({ status: "refunded", paypalRefundId: refund.id })
          .where(eq(contributions.id, contribution.id));
        await appendEntry(
          { fundId, type: "refund", amountCents: -contribution.amountCents, sourceRef: `refund:${contribution.id}` },
          tx,
        );
      });
      refunded += 1;
    } catch (error) {
      console.error(`Refund failed for contribution ${contribution.id}`, error);
      failed += 1;
    }
  }
  return { refunded, failed };
}
