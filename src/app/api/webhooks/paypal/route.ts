import { eq } from "drizzle-orm";
import { recordCapture } from "@/lib/contributions";
import { db } from "@/lib/db";
import { contributions, payouts, webhookEvents } from "@/lib/db/schema";
import { toCents } from "@/lib/money";
import { verifyWebhook } from "@/lib/paypal/client";
import { applyPayoutStatus } from "@/lib/payouts";

type WebhookEvent = { id: string; event_type: string; resource: Record<string, unknown> };

type CaptureResource = {
  id: string;
  status: string;
  amount: { value: string; currency_code: string };
  supplementary_data?: { related_ids?: { order_id?: string } };
};

type PayoutItemResource = { payout_item_id: string; payout_batch_id: string; transaction_status: string };

// PayPal webhook: verifies the signature, stores each event once, then updates the ledger.
// A non-2xx answer makes PayPal retry, so only a bad signature is refused.
export async function POST(request: Request) {
  const event = (await request.json()) as WebhookEvent;

  if (!(await verifyWebhook(request.headers, event))) {
    console.warn(`PayPal webhook rejected: signature did not verify (event ${event.id})`);
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }

  await db
    .insert(webhookEvents)
    .values({ paypalEventId: event.id, type: event.event_type, payload: event })
    .onConflictDoNothing();
  const [stored] = await db.select().from(webhookEvents).where(eq(webhookEvents.paypalEventId, event.id));
  if (stored.processedAt) return Response.json({ received: true, duplicate: true });

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    await handleCapture(event.resource as unknown as CaptureResource);
  } else if (event.event_type.startsWith("PAYMENT.PAYOUTS-ITEM.")) {
    await handlePayoutItem(event.resource as unknown as PayoutItemResource);
  }

  await db.update(webhookEvents).set({ processedAt: new Date() }).where(eq(webhookEvents.paypalEventId, event.id));
  console.log(`PayPal webhook processed: ${event.event_type} event=${event.id}`);
  return Response.json({ received: true });
}

// Backup for the capture route: if the browser closed before capture finished, this records it.
async function handleCapture(capture: CaptureResource) {
  const orderId = capture.supplementary_data?.related_ids?.order_id;
  if (!orderId || capture.status !== "COMPLETED" || capture.amount.currency_code !== "USD") return;

  const [contribution] = await db.select().from(contributions).where(eq(contributions.paypalOrderId, orderId));
  if (contribution) await recordCapture(contribution, capture.id, toCents(capture.amount.value));
}

async function handlePayoutItem(item: PayoutItemResource) {
  const [payout] = await db.select().from(payouts).where(eq(payouts.paypalBatchId, item.payout_batch_id));
  if (payout) await applyPayoutStatus(payout, item.transaction_status, item.payout_item_id);
}
