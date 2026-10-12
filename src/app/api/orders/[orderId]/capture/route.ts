import { notImplemented } from "@/lib/http";

// Captures the order after the buyer approves it; writes the ledger entry.
export async function POST() {
  return notImplemented("POST /api/orders/:orderId/capture");
}
