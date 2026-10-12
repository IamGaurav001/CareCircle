import { and, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contributions, documents, ledgerEntries, payouts } from "@/lib/db/schema";
import { getFund, PUBLIC_STATUSES } from "@/lib/funds";
import { HttpError, route, uuidParam } from "@/lib/http";

// The report's figures, every one from the ledger. The Gemini summary (teammate's task)
// writes words around these numbers and never computes its own.
export const GET = route(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const fund = await getFund(uuidParam((await params).id));
  if (!PUBLIC_STATUSES.includes(fund.status)) throw new HttpError(404, "Not found");

  const entries = await db
    .select({ type: ledgerEntries.type, amountCents: ledgerEntries.amountCents })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.fundId, fund.id));
  const sum = (type: string) =>
    entries.filter((entry) => entry.type === type).reduce((total, entry) => total + entry.amountCents, 0);

  const [{ contributors }] = await db
    .select({ contributors: count() })
    .from(contributions)
    .where(and(eq(contributions.fundId, fund.id), eq(contributions.status, "captured")));
  const [{ receipts }] = await db
    .select({ receipts: count() })
    .from(documents)
    .where(and(eq(documents.fundId, fund.id), eq(documents.kind, "receipt")));
  const paid = await db
    .select({ amountCents: payouts.amountCents, createdAt: payouts.createdAt })
    .from(payouts)
    .where(and(eq(payouts.fundId, fund.id), eq(payouts.status, "succeeded")));

  return Response.json({
    fund: { id: fund.id, title: fund.title, purpose: fund.purpose, payeeName: fund.payeeName, status: fund.status },
    approvedCents: fund.approvedCents,
    raisedCents: sum("contribution"),
    refundedCents: Math.abs(sum("refund")),
    paidOutCents: Math.abs(sum("payout")),
    balanceCents: entries.reduce((total, entry) => total + entry.amountCents, 0),
    contributions: contributors,
    payouts: paid,
    receipts,
  });
});
