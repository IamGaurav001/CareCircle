import "server-only";
import { and, eq, inArray } from "drizzle-orm";
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
 * status check. Success, or Unclaimed (PayPal has taken the money and holds it until the
 * hospital accepts it): the ledger records the money leaving and the fund waits for the
 * receipt. Failure: the fund reopens with its balance back. Anything else (pending, on
 * hold): the fund stays in Releasing. Safe to call repeatedly with the same status.
 */
export async function applyPayoutStatus(payout: Payout, transactionStatus: string, paypalItemId?: string) {
  if (FINAL_STATUSES.includes(payout.status)) return payout.status;

  if (SUCCEEDED.includes(transactionStatus) || transactionStatus === "UNCLAIMED") {
    const status = transactionStatus === "UNCLAIMED" ? "unclaimed" : "succeeded";
    await db.transaction(async (tx) => {
      await tx.update(payouts).set({ status, paypalItemId }).where(eq(payouts.id, payout.id));
      await appendEntry(
        { fundId: payout.fundId, type: "payout", amountCents: -payout.amountCents, sourceRef: `payout:${payout.id}` },
        tx,
      );
      await tx
        .update(funds)
        .set({ status: "receipts_due" })
        .where(and(eq(funds.id, payout.fundId), eq(funds.status, "releasing")));
    });
    return status;
  }

  if (FAILED.includes(transactionStatus)) {
    await db.transaction(async (tx) => {
      await tx.update(payouts).set({ status: "failed", paypalItemId }).where(eq(payouts.id, payout.id));
      // An unclaimed payout that PayPal later returned was already recorded as sent: put it back.
      if (payout.status === "unclaimed") {
        await appendEntry(
          { fundId: payout.fundId, type: "payout", amountCents: payout.amountCents, sourceRef: `payout-returned:${payout.id}` },
          tx,
        );
      }
      await tx
        .update(funds)
        .set({ status: "open" })
        .where(and(eq(funds.id, payout.fundId), inArray(funds.status, ["releasing", "receipts_due"])));
    });
    return "failed";
  }

  await db.update(payouts).set({ status: "pending", paypalItemId }).where(eq(payouts.id, payout.id));
  return "pending";
}
