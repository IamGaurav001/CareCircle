import Link from "next/link";
import { ActionButton, ReceiptsForm, ReviewForm } from "@/components/actions";
import { Card, ChecksList, ExtractionView, LedgerTable, Page, Progress, ReviewHistory, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import { runChecks } from "@/lib/funds";
import { fundOrNotFound, getLatestPayout, getLedger, listDocuments, listReviews } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

const PAYOUT_STATUS: Record<string, string> = {
  pending: "PayPal is processing the payout.",
  unclaimed: "PayPal is holding the money: the payee's email has no PayPal account yet. The balance is unchanged.",
  unknown: "PayPal did not confirm the payout. Check the PayPal dashboard before doing anything else.",
  succeeded: "PayPal confirmed the payout.",
  failed: "The payout failed, so the fund is open again with its balance unchanged.",
};

export default async function ReviewFund({ params }: { params: Promise<{ id: string }> }) {
  await requirePageRole("reviewer");
  const fund = await fundOrNotFound((await params).id);

  const [estimates, receipts, reviews, ledger, payout, checks] = await Promise.all([
    listDocuments(fund.id, "estimate"),
    listDocuments(fund.id, "receipt"),
    listReviews(fund.id),
    getLedger(fund.id),
    getLatestPayout(fund.id),
    runChecks(fund),
  ]);
  const extraction = estimates.find((item) => item.extraction)?.extraction ?? null;
  // The same limit the release route applies.
  const releasableCents = Math.min(ledger.balanceCents, (fund.approvedCents ?? 0) - ledger.paidOutCents);

  return (
    <Page
      title={fund.title}
      subtitle={
        <span className="flex items-center gap-3">
          <StatusBadge status={fund.status} />
          {fund.status !== "in_review" && fund.status !== "rejected" && (
            <Link href={`/f/${fund.id}`} className="text-accent underline">
              Public page
            </Link>
          )}
        </span>
      }
    >
      <Card title="The request">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Asked for</dt>
            <dd className="font-medium">{formatUsd(fund.requestedCents)}</dd>
          </div>
          <div>
            <dt className="text-muted">Approved</dt>
            <dd className="font-medium">{fund.approvedCents != null ? formatUsd(fund.approvedCents) : "Not yet"}</dd>
          </div>
          <div>
            <dt className="text-muted">Payee</dt>
            <dd className="font-medium">{fund.payeeName}</dd>
          </div>
          <div>
            <dt className="text-muted">Payee&apos;s PayPal</dt>
            <dd className="font-medium break-all">{fund.payeePaypalEmail}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-muted">{fund.purpose}</p>
      </Card>

      <Card title="Estimate, as the AI read it">
        {extraction ? <ExtractionView extraction={extraction} /> : <p className="text-sm text-muted">No estimate read yet.</p>}
      </Card>

      <Card title="Rule checks">
        <ChecksList checks={checks} />
        <p className="mt-3 text-xs text-muted">Checks and AI flags inform you; they never decide. The bill is in its own currency, the fund in USD.</p>
      </Card>

      {fund.status === "in_review" && (
        <Card title="Your decision">
          <ReviewForm fundId={fund.id} requestedCents={fund.requestedCents} />
        </Card>
      )}

      {["open", "releasing", "receipts_due", "closed"].includes(fund.status) && (
        <Card title="Money">
          <div className="flex flex-col gap-4">
            <Progress raisedCents={ledger.raisedCents} approvedCents={fund.approvedCents ?? 0} />
            <p className="text-sm">
              Balance held: <span className="font-semibold">{formatUsd(ledger.balanceCents)}</span>
              {ledger.paidOutCents > 0 && <> · Paid to payee: <span className="font-semibold">{formatUsd(ledger.paidOutCents)}</span></>}
            </p>
            {payout && <p className="text-sm text-muted">Latest payout ({formatUsd(payout.amountCents)}): {PAYOUT_STATUS[payout.status] ?? payout.status}</p>}
            {fund.status === "open" &&
              (releasableCents > 0 ? (
                <ActionButton
                  url={`/api/funds/${fund.id}/release`}
                  label={`Release ${formatUsd(releasableCents)} to ${fund.payeeName}`}
                  pendingLabel="Sending payout…"
                />
              ) : (
                <p className="text-sm text-muted">Nothing to release yet.</p>
              ))}
            {fund.status === "releasing" && (
              <ActionButton url={`/api/funds/${fund.id}/release/sync`} label="Check PayPal status" pendingLabel="Asking PayPal…" secondary />
            )}
            <LedgerTable entries={ledger.entries} />
          </div>
        </Card>
      )}

      {(fund.status === "receipts_due" || receipts.length > 0) && (
        <Card title={`Receipts (${receipts.length})`}>
          <div className="flex flex-col gap-4">
            {receipts.map(({ document, extraction: read }) => (
              <div key={document.id} className="rounded-lg border border-border p-3 text-sm">
                {read ? <ExtractionView extraction={read} /> : <span className="text-muted">Uploaded, not read yet.</span>}
              </div>
            ))}
            {fund.status === "receipts_due" && <ReceiptsForm fundId={fund.id} />}
          </div>
        </Card>
      )}

      <Card title="Decisions so far">
        <ReviewHistory reviews={reviews} />
      </Card>
    </Page>
  );
}
