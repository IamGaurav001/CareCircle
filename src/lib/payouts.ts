import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { funds, payouts } from "@/lib/db/schema";
import { appendEntry } from "@/lib/ledger";

export type Payout = typeof payouts.$inferSelect;

// PayPal payout item statuses, grouped by what they mean for the fund.
const SUCCEEDED = ["SUCCESS"];
const FAILED = ["FAILED", "RETURNED", "BLOCKED", "DENIED", "REFUNDED", "REVERSED"];

/** Our statuses that PayPal can no longer change. */
export const FINAL_STATUSES = ["succeeded", "failed"];

/**
 * Applies a payout item's status from PayPal, whether it came by webhook or by the
 * status check. Success: the ledger records the money leaving and the fund waits for
 * receipts. Failure: the fund reopens with its balance unchanged. Anything else
 * (pending, unclaimed, on hold): the fund stays locked in Releasing.
 * Safe to call repeatedly with the same status.
 */
export async function applyPayoutStatus(payout: Payout, transactionStatus: string, paypalItemId?: string) {
  if (FINAL_STATUSES.includes(payout.status)) return payout.status;

  if (SUCCEEDED.includes(transactionStatus)) {
    await db.transaction(async (tx) => {
      await tx.update(payouts).set({ status: "succeeded", paypalItemId }).where(eq(payouts.id, payout.id));
      await appendEntry(
        { fundId: payout.fundId, type: "payout", amountCents: -payout.amountCents, sourceRef: `payout:${payout.id}` },
        tx,
      );
      await tx
        .update(funds)
        .set({ status: "receipts_due" })
        .where(and(eq(funds.id, payout.fundId), eq(funds.status, "releasing")));
    });
    return "succeeded";
  }

  if (FAILED.includes(transactionStatus)) {
    await db.transaction(async (tx) => {
      await tx.update(payouts).set({ status: "failed", paypalItemId }).where(eq(payouts.id, payout.id));
      await tx
        .update(funds)
        .set({ status: "open" })
        .where(and(eq(funds.id, payout.fundId), eq(funds.status, "releasing")));
    });
    return "failed";
  }

  const waiting = transactionStatus === "UNCLAIMED" ? "unclaimed" : "pending";
  await db.update(payouts).set({ status: waiting, paypalItemId }).where(eq(payouts.id, payout.id));
  return waiting;
}
