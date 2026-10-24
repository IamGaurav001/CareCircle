import "server-only";
import { and, desc, eq, ne, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiExtractions, documents, funds } from "@/lib/db/schema";
import { HttpError } from "@/lib/http";
import { formatMoney, formatUsd } from "@/lib/money";
import { approxUsdCents } from "./fx";
import { looksLikeSameProvider } from "./names";

export type Fund = typeof funds.$inferSelect;

/** Statuses in which a fund's page and ledger are public. */
export const PUBLIC_STATUSES: Fund["status"][] = ["open", "releasing", "receipts_due", "closed", "cancelled"];

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
      ? "The AI could not read the newest bill. Upload it again, or a clearer copy."
      : "Upload the hospital bill and wait for the AI to read it.";
    return [{ check: "estimate", ok: false, blocking: true, message }];
  }
  const results: CheckResult[] = [
    { check: "estimate", ok: true, blocking: true, message: "The bill is uploaded and the AI has read it." },
  ];

  const { lineItems, statedTotalMinor, currency } = latest.extraction;
  const sum = lineItems.reduce((total, item) => total + item.amountMinor, 0);
  if (statedTotalMinor == null) {
    results.push({ check: "total", ok: false, blocking: false, message: "No total was found on the bill, so the charges could not be checked against it." });
  } else if (sum !== statedTotalMinor) {
    results.push({
      check: "total",
      ok: false,
      blocking: false,
      message: `The charges add up to ${formatMoney(sum, currency ?? "")}, but the total printed on the bill is ${formatMoney(statedTotalMinor, currency ?? "")}.`,
    });
  } else {
    results.push({ check: "total", ok: true, blocking: false, message: "The charges add up to the total printed on the bill." });
  }

  // The bill's hospital should be the one that gets paid; a different name is the simplest fraud.
  const { providerName } = latest.extraction;
  if (!providerName) {
    results.push({
      check: "hospital",
      ok: false,
      blocking: false,
      message: `No hospital name was found on the bill, so it could not be compared with "${fund.payeeName}".`,
    });
  } else if (!looksLikeSameProvider(providerName, fund.payeeName)) {
    results.push({
      check: "hospital",
      ok: false,
      blocking: false,
      message: `The bill is from "${providerName}", but the money would go to "${fund.payeeName}". They should be the same hospital.`,
    });
  } else {
    results.push({ check: "hospital", ok: true, blocking: false, message: `The bill is from "${providerName}", the hospital that will be paid.` });
  }

  // A fundraiser should not ask for much more than its bill. Rates are rough, so allow some room.
  const billTotal = statedTotalMinor ?? sum;
  const billUsdCents = approxUsdCents(billTotal, currency);
  if (billUsdCents == null) {
    results.push({ check: "amount", ok: false, blocking: false, message: "The bill's currency could not be read, so the amount asked for could not be compared with it." });
  } else if (fund.requestedCents > billUsdCents * 1.15) {
    results.push({
      check: "amount",
      ok: false,
      blocking: false,
      message: `The fundraiser asks for ${formatUsd(fund.requestedCents)}, but the bill comes to about ${formatUsd(billUsdCents)}.`,
    });
  } else {
    results.push({ check: "amount", ok: true, blocking: false, message: `The amount asked for is within the bill's total (about ${formatUsd(billUsdCents)}).` });
  }

  // Anything else the AI found hard to read or worth a look. A wrong total is already covered above.
  const notes = latest.extraction.flags.filter((flag) => flag.kind !== "total_mismatch");
  results.push(
    notes.length > 0
      ? { check: "ai", ok: false, blocking: false, message: `The AI asked for a closer look: ${notes.map((flag) => flag.message).join(" ")}` }
      : { check: "ai", ok: true, blocking: false, message: "The AI found nothing unusual on the bill." },
  );

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
      ? { check: "duplicate", ok: false, blocking: false, message: `${duplicates.length} other ${duplicates.length === 1 ? "fundraiser asks" : "fundraisers ask"} for the same amount for the same hospital.` }
      : { check: "duplicate", ok: true, blocking: false, message: "No other fundraiser asks for the same amount for the same hospital." },
  );

  return results;
}
