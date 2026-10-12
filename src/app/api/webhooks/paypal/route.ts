import { verifyWebhook } from "@/lib/paypal/client";

// PayPal webhook. For the payout test it verifies the signature and logs the event.
// Storing each event once and updating the ledger come next (tab 2 of the plan doc).
export async function POST(request: Request) {
  const event = (await request.json()) as { id?: string; event_type?: string; resource?: { id?: string } };

  if (!(await verifyWebhook(request.headers, event))) {
    console.warn(`PayPal webhook rejected: signature did not verify (event ${event.id})`);
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }

  console.log(`PayPal webhook verified: ${event.event_type} event=${event.id} resource=${event.resource?.id}`);
  return Response.json({ received: true });
}
