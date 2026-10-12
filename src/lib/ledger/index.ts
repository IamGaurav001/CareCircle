import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ledgerEntries } from "@/lib/db/schema";

/** A fund's balance in cents: the sum of its ledger entries. */
export async function getBalanceCents(fundId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${ledgerEntries.amountCents}), 0)` })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.fundId, fundId));
  return Number(row.total);
}

/**
 * Appends one ledger entry. Returns false when its sourceRef is already recorded,
 * which is what happens when PayPal resends a webhook or a capture is retried.
 */
export async function appendEntry(entry: typeof ledgerEntries.$inferInsert): Promise<boolean> {
  const inserted = await db
    .insert(ledgerEntries)
    .values(entry)
    .onConflictDoNothing({ target: ledgerEntries.sourceRef })
    .returning({ id: ledgerEntries.id });
  return inserted.length > 0;
}
