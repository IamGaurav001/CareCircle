import "server-only";
import { and, desc, eq, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { aiExtractions, documents, funds, ledgerEntries, payouts, reviews, users } from "@/lib/db/schema";

// Reads for the screens. Writes go through the API routes, which hold the rules.

/** For pages: the fund, or Next.js's 404 page when the id is malformed or unknown. */
export async function fundOrNotFound(id: string) {
  if (!z.uuid().safeParse(id).success) notFound();
  const [fund] = await db.select().from(funds).where(eq(funds.id, id));
  if (!fund) notFound();
  return fund;
}

export function listFundsByOwner(ownerId: string) {
  return db.select().from(funds).where(eq(funds.ownerId, ownerId)).orderBy(desc(funds.createdAt));
}

/** Every fund a reviewer can act on or look back at: all but drafts. */
export function listFundsForReview() {
  return db.select().from(funds).where(ne(funds.status, "draft")).orderBy(desc(funds.createdAt));
}

export type DocumentWithExtraction = {
  document: typeof documents.$inferSelect;
  extraction: typeof aiExtractions.$inferSelect | null;
};

/** A fund's documents of one kind, newest first, each with its AI reading if there is one. */
export async function listDocuments(fundId: string, kind: "estimate" | "receipt"): Promise<DocumentWithExtraction[]> {
  return db
    .select({ document: documents, extraction: aiExtractions })
    .from(documents)
    .leftJoin(aiExtractions, eq(aiExtractions.documentId, documents.id))
    .where(and(eq(documents.fundId, fundId), eq(documents.kind, kind)))
    .orderBy(desc(documents.createdAt));
}

export function listReviews(fundId: string) {
  return db
    .select({
      stage: reviews.stage,
      decision: reviews.decision,
      note: reviews.note,
      createdAt: reviews.createdAt,
      reviewer: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.reviewerId))
    .where(eq(reviews.fundId, fundId))
    .orderBy(desc(reviews.createdAt));
}

export async function getLatestPayout(fundId: string) {
  const [payout] = await db
    .select()
    .from(payouts)
    .where(eq(payouts.fundId, fundId))
    .orderBy(desc(payouts.createdAt))
    .limit(1);
  return payout ?? null;
}

/** The ledger's entries, newest first, with the balance and the totals in and out. */
export async function getLedger(fundId: string) {
  const entries = await db
    .select({ id: ledgerEntries.id, type: ledgerEntries.type, amountCents: ledgerEntries.amountCents, createdAt: ledgerEntries.createdAt })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.fundId, fundId))
    .orderBy(desc(ledgerEntries.createdAt));
  const total = (type: string) =>
    entries.filter((entry) => entry.type === type).reduce((sum, entry) => sum + entry.amountCents, 0);
  return {
    entries,
    balanceCents: entries.reduce((sum, entry) => sum + entry.amountCents, 0),
    raisedCents: total("contribution"),
    paidOutCents: Math.abs(total("payout")), // payouts are stored negative; abs also avoids "-$0.00"
  };
}
