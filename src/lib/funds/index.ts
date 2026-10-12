import "server-only";
import { and, desc, eq, ne, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiExtractions, documents, funds } from "@/lib/db/schema";
import { HttpError } from "@/lib/http";
import { formatMoney } from "@/lib/money";

export type Fund = typeof funds.$inferSelect;

/** Statuses in which a fund's page and ledger are public. */
export const PUBLIC_STATUSES: Fund["status"][] = ["open", "releasing", "receipts_due", "closed"];

export async function getFund(id: string): Promise<Fund> {
  const [fund] = await db.select().from(funds).where(eq(funds.id, id));
  if (!fund) throw new HttpError(404, "Not found");
  return fund;
}

export type CheckResult = { check: string; ok: boolean; blocking: boolean; message: string };

/**
 * Code-side checks before review. A blocking check stops the family from submitting;
 * the others are shown to the reviewer, who decides. No check rejects a family by itself.
 */
export async function runChecks(fund: Fund): Promise<CheckResult[]> {
  // The newest estimate counts, read or not: an older reading must never stand in for
  // a newer bill the AI could not read.
  const [latest] = await db
    .select({ extraction: aiExtractions })
    .from(documents)
    .leftJoin(aiExtractions, eq(aiExtractions.documentId, documents.id))
    .where(and(eq(documents.fundId, fund.id), eq(documents.kind, "estimate")))
    .orderBy(desc(documents.createdAt))
    .limit(1);

  if (!latest?.extraction) {
    const message = latest
      ? "The newest estimate could not be read. Upload it again, or a clearer copy."
      : "Upload the hospital estimate and wait for it to be read.";
    return [{ check: "estimate", ok: false, blocking: true, message }];
  }
  const results: CheckResult[] = [
    { check: "estimate", ok: true, blocking: true, message: "Estimate uploaded and read." },
  ];

  const { lineItems, statedTotalMinor, currency } = latest.extraction;
  const sum = lineItems.reduce((total, item) => total + item.amountMinor, 0);
  if (statedTotalMinor == null) {
    results.push({ check: "total", ok: false, blocking: false, message: "No total was found on the bill to compare against." });
  } else if (sum !== statedTotalMinor) {
    results.push({
      check: "total",
      ok: false,
      blocking: false,
      message: `Line items add up to ${formatMoney(sum, currency ?? "")}, but the bill's total is ${formatMoney(statedTotalMinor, currency ?? "")}.`,
    });
  } else {
    results.push({ check: "total", ok: true, blocking: false, message: "Line items add up to the bill's total." });
  }

  const duplicates = await db
    .select({ id: funds.id })
    .from(funds)
    .where(
      and(
        ne(funds.id, fund.id),
        eq(funds.payeePaypalEmail, fund.payeePaypalEmail),
        eq(funds.requestedCents, fund.requestedCents),
        notInArray(funds.status, ["draft", "rejected"]),
      ),
    );
  results.push(
    duplicates.length > 0
      ? { check: "duplicate", ok: false, blocking: false, message: `${duplicates.length} other fund(s) ask the same amount for the same payee.` }
      : { check: "duplicate", ok: true, blocking: false, message: "No other fund asks the same amount for the same payee." },
  );

  return results;
}
