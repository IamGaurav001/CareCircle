import { notImplemented } from "@/lib/http";

// PayPal webhook: verify signature, store the event once, update the ledger.
export async function POST() {
  return notImplemented("POST /api/webhooks/paypal");
}
