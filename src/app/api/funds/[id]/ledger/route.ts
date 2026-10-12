import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ledgerEntries } from "@/lib/db/schema";
import { getFund, PUBLIC_STATUSES } from "@/lib/funds";
import { HttpError, route, uuidParam } from "@/lib/http";

// Public ledger: the fund, its balance, and every entry. Contributors stay anonymous.
export const GET = route(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const fund = await getFund(uuidParam((await params).id));
  if (!PUBLIC_STATUSES.includes(fund.status)) throw new HttpError(404, "Not found");

  const entries = await db
    .select({ type: ledgerEntries.type, amountCents: ledgerEntries.amountCents, createdAt: ledgerEntries.createdAt })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.fundId, fund.id))
    .orderBy(desc(ledgerEntries.createdAt));

  return Response.json({
    fund: {
      id: fund.id,
      title: fund.title,
      purpose: fund.purpose,
      payeeName: fund.payeeName,
      status: fund.status,
      approvedCents: fund.approvedCents,
    },
    balanceCents: entries.reduce((total, entry) => total + entry.amountCents, 0),
    entries,
  });
});
