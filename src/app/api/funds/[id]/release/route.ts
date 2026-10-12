import { notImplemented } from "@/lib/http";

// Reviewer approves the release; sends a payout with a fixed sender_batch_id.
export async function POST() {
  return notImplemented("POST /api/funds/:id/release");
}
