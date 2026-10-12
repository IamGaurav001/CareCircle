import { notImplemented } from "@/lib/http";

// Public ledger: contributions, payouts, balance.
export async function GET() {
  return notImplemented("GET /api/funds/:id/ledger");
}
