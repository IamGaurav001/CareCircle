import { desc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { payouts } from "@/lib/db/schema";
import { getFund } from "@/lib/funds";
import { HttpError, route, uuidParam } from "@/lib/http";
import { paypalRequest } from "@/lib/paypal/client";
import { applyPayoutStatus, FINAL_STATUSES } from "@/lib/payouts";

type PayoutBatch = {
  items: {
    payout_item_id: string;
    transaction_status: string;
    errors?: { name: string; message: string };
  }[];
};

// Asks PayPal for the latest payout's status and applies it, for when the webhook did not arrive.
export const POST = route(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireRole("reviewer");
  const fund = await getFund(uuidParam((await params).id));

  const [payout] = await db
    .select()
    .from(payouts)
    .where(eq(payouts.fundId, fund.id))
    .orderBy(desc(payouts.createdAt))
    .limit(1);
  if (!payout) throw new HttpError(404, "No payment to the hospital has been sent yet");
  if (FINAL_STATUSES.includes(payout.status)) {
    return Response.json({ payoutStatus: payout.status, fundStatus: fund.status });
  }
  if (!payout.paypalBatchId) {
    throw new HttpError(409, "PayPal never confirmed this payment. Check the PayPal dashboard.");
  }

  const batch = await paypalRequest<PayoutBatch>(`/v1/payments/payouts/${payout.paypalBatchId}`);
  const item = batch.items[0];
  if (!item) return Response.json({ payoutStatus: payout.status, fundStatus: fund.status });

  const payoutStatus = await applyPayoutStatus(payout, item.transaction_status, item.payout_item_id);
  const updated = await getFund(fund.id);
  return Response.json({
    payoutStatus,
    paypalStatus: item.transaction_status,
    fundStatus: updated.status,
    paypalError: item.errors,
  });
});
