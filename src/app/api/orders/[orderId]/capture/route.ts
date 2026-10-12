import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contributions } from "@/lib/db/schema";
import { HttpError, route } from "@/lib/http";
import { appendEntry, getBalanceCents } from "@/lib/ledger";
import { toCents } from "@/lib/money";
import { paypalRequest } from "@/lib/paypal/client";

type CapturedOrder = {
  status: string;
  purchase_units: {
    payments?: { captures?: { id: string; status: string; amount: { value: string; currency_code: string } }[] };
  }[];
};

// Captures the order after the buyer approves it, and writes the ledger entry.
export const POST = route(async (_request: Request, { params }: { params: Promise<{ orderId: string }> }) => {
  const { orderId } = await params;
  if (!/^[A-Z0-9]{10,30}$/.test(orderId)) throw new HttpError(404, "Not found");

  const [contribution] = await db.select().from(contributions).where(eq(contributions.paypalOrderId, orderId));
  if (!contribution) throw new HttpError(404, "Not found");

  // The contribution's id is the request id, so a retried capture is the same capture to PayPal.
  const order = await paypalRequest<CapturedOrder>(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    requestId: contribution.id,
  });
  const capture = order.purchase_units[0]?.payments?.captures?.[0];
  if (order.status !== "COMPLETED" || capture?.status !== "COMPLETED") {
    throw new HttpError(402, "The payment did not complete", { orderStatus: order.status, captureStatus: capture?.status });
  }
  if (capture.amount.currency_code !== "USD") throw new HttpError(422, "Only USD contributions are supported");

  // PayPal's captured amount is what reached us, so the ledger records that.
  const amountCents = toCents(capture.amount.value);
  await db.transaction(async (tx) => {
    await tx
      .update(contributions)
      .set({ paypalCaptureId: capture.id, status: "captured" })
      .where(eq(contributions.id, contribution.id));
    await appendEntry(
      { fundId: contribution.fundId, type: "contribution", amountCents, sourceRef: capture.id },
      tx,
    );
  });

  return Response.json({
    status: "captured",
    amountCents,
    balanceCents: await getBalanceCents(contribution.fundId),
  });
});
