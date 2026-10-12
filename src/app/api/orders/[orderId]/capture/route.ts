import { eq } from "drizzle-orm";
import { recordCapture } from "@/lib/contributions";
import { db } from "@/lib/db";
import { contributions, funds } from "@/lib/db/schema";
import { HttpError, route } from "@/lib/http";
import { getBalanceCents } from "@/lib/ledger";
import { toCents } from "@/lib/money";
import { paypalRequest } from "@/lib/paypal/client";
import { PaypalError } from "@/lib/paypal/rest";

/** The first issue code PayPal gave for a failed request, such as ORDER_NOT_APPROVED. */
function paypalIssue(error: unknown): string | undefined {
  if (!(error instanceof PaypalError)) return undefined;
  return (error.details as { details?: { issue?: string }[] } | null)?.details?.[0]?.issue;
}

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

  // A payment approved on PayPal after the fundraiser closed is never taken; PayPal drops the order.
  const [fund] = await db.select({ status: funds.status }).from(funds).where(eq(funds.id, contribution.fundId));
  if (fund?.status !== "open" && contribution.status !== "captured") {
    throw new HttpError(409, "This fundraiser is no longer taking payments, so nothing was charged.");
  }

  // The contribution's id is the request id, so a retried capture is the same capture to PayPal.
  const order = await paypalRequest<CapturedOrder>(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    requestId: contribution.id,
  }).catch((error: unknown) => {
    if (paypalIssue(error) === "ORDER_NOT_APPROVED") {
      throw new HttpError(409, "The payment has not been approved on PayPal yet");
    }
    throw error;
  });
  const capture = order.purchase_units[0]?.payments?.captures?.[0];
  if (order.status !== "COMPLETED" || capture?.status !== "COMPLETED") {
    throw new HttpError(402, "The payment did not go through", { orderStatus: order.status, captureStatus: capture?.status });
  }
  if (capture.amount.currency_code !== "USD") throw new HttpError(422, "Only payments in US dollars are accepted");

  // PayPal's captured amount is what reached us, so the ledger records that.
  const amountCents = toCents(capture.amount.value);
  await recordCapture(contribution, capture.id, amountCents);

  return Response.json({
    status: "captured",
    amountCents,
    balanceCents: await getBalanceCents(contribution.fundId),
  });
});
