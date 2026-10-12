import Link from "next/link";
import { ActionButton, ReceiptsForm, ReviewForm } from "@/components/actions";
import {
  Card,
  ChecksList,
  ExtractionView,
  FileLink,
  LedgerTable,
  NextStep,
  Page,
  Progress,
  ReviewHistory,
  Stat,
  StatusBadge,
  TrustTrack,
} from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import { runChecks } from "@/lib/funds";
import { fundOrNotFound, getLatestPayout, getLedger, listDocuments, listReviews } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

const PAYOUT_STATUS: Record<string, string> = {
  pending: "PayPal is processing the payout.",
  unclaimed: "PayPal is holding the money: the hospital's email has no PayPal account yet. The balance is unchanged.",
  unknown: "PayPal did not confirm the payout. Check the PayPal dashboard before doing anything else.",
  succeeded: "PayPal confirmed the payout.",
  failed: "The payout failed, so the fund is open again with its balance unchanged.",
};

const NEXT_STEP = {
  draft: { tone: "accent", text: "The family has not submitted this fund yet." },
  in_review: { tone: "warning", text: "Read the AI's explanation, the flags and the rule checks, then approve an amount or reject with a reason." },
  rejected: { tone: "danger", text: "You did not approve this bill. No one can pay into it." },
  open: { tone: "accent", text: "Family members are paying. Send the money to the hospital when it is needed." },
  releasing: { tone: "warning", text: "The payout is with PayPal. If the status does not update by itself, check it with PayPal." },
  receipts_due: { tone: "warning", text: "The hospital was paid. Check the family's receipts and close the fund, or ask for more." },
  closed: { tone: "success", text: "Completed. Nothing left to do." },
} as const;

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
  // The newest upload is the estimate; an older reading never stands in for it.
  const estimate = estimates[0] ?? null;
  const extraction = estimate?.extraction ?? null;
  // The same limit the release route applies.
  const releasableCents = Math.min(ledger.balanceCents, (fund.approvedCents ?? 0) - ledger.paidOutCents);
  const hasMoney = ["open", "releasing", "receipts_due", "closed"].includes(fund.status);
  const next = NEXT_STEP[fund.status];

  return (
    <Page
      eyebrow={<Link href="/review" className="hover:text-accent">← Review queue</Link>}
      title={fund.title}
      subtitle={<StatusBadge status={fund.status} />}
      actions={
        hasMoney ? (
          <Link href={`/f/${fund.id}`} className="text-sm font-semibold text-accent">
            Family&apos;s share page →
          </Link>
        ) : undefined
      }
    >
      <Card>
        <TrustTrack status={fund.status} />
      </Card>
      <NextStep tone={next.tone}>{next.text}</NextStep>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          {fund.status === "in_review" && (
            <Card title="Your decision" tone="warning">
              <ReviewForm fundId={fund.id} requestedCents={fund.requestedCents} />
            </Card>
          )}

          {hasMoney && (
            <Card title="Money">
              <div className="flex flex-col gap-5">
                <Progress raisedCents={ledger.raisedCents} approvedCents={fund.approvedCents ?? 0} large />
                {payout && (
                  <p className="rounded-xl bg-background px-3 py-2 text-sm">
                    <span className="font-semibold">Payout of {formatUsd(payout.amountCents)}:</span> {PAYOUT_STATUS[payout.status] ?? payout.status}
                  </p>
                )}
                {fund.status === "open" &&
                  (releasableCents > 0 ? (
                    <div className="flex flex-col gap-2 rounded-xl border border-accent/30 bg-accent-soft p-4">
                      <p className="text-sm">
                        Sends <span className="font-semibold">{formatUsd(releasableCents)}</span> through PayPal Payouts to{" "}
                        <span className="font-semibold">{fund.payeeName}</span> ({fund.payeePaypalEmail}). The fund is locked until PayPal confirms.
                      </p>
                      <div className="self-start">
                        <ActionButton url={`/api/funds/${fund.id}/release`} label={`Pay ${formatUsd(releasableCents)} to the hospital`} pendingLabel="Sending to PayPal…" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted">Nothing to release yet: no contributions have arrived.</p>
                  ))}
                {fund.status === "releasing" && (
                  <div className="self-start">
                    <ActionButton url={`/api/funds/${fund.id}/release/sync`} label="Check status with PayPal" pendingLabel="Asking PayPal…" secondary />
                  </div>
                )}
                <LedgerTable entries={ledger.entries} />
              </div>
            </Card>
          )}

          {(fund.status === "receipts_due" || receipts.length > 0) && (
            <Card title={`Hospital receipts (${receipts.length})`} tone={fund.status === "receipts_due" ? "warning" : "plain"}>
              <div className="flex flex-col gap-4">
                {receipts.map(({ document, extraction: read }) => (
                  <div key={document.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="mb-3"><FileLink documentId={document.id} /></div>
                    {read ? <ExtractionView extraction={read} /> : <span className="text-sm text-muted">Uploaded; the AI could not read it.</span>}
                  </div>
                ))}
                {fund.status === "receipts_due" && <ReceiptsForm fundId={fund.id} />}
              </div>
            </Card>
          )}

          <Card title="Estimate, as the AI read it" aside={estimate ? <FileLink documentId={estimate.document.id} /> : undefined}>
            {extraction ? <ExtractionView extraction={extraction} /> : <p className="text-sm text-muted">No estimate read yet.</p>}
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card title="The request">
            <dl className="grid grid-cols-2 gap-4">
              <Stat label="Asked" value={formatUsd(fund.requestedCents)} />
              <Stat label="Approved" value={fund.approvedCents != null ? formatUsd(fund.approvedCents) : "—"} />
            </dl>
            <p className="mt-4 text-sm leading-6 text-muted">{fund.purpose}</p>
            <div className="mt-4 border-t border-border pt-4 text-sm">
              <div className="text-muted">Hospital (cannot be changed)</div>
              <div className="font-semibold">{fund.payeeName}</div>
              <div className="break-all text-xs text-muted">{fund.payeePaypalEmail}</div>
            </div>
          </Card>
          <Card title="Rule checks">
            <ChecksList checks={checks} />
            <p className="mt-4 text-xs text-muted">The bill is in its own currency; the fund is in USD.</p>
          </Card>
          <Card title="Decisions so far">
            <ReviewHistory reviews={reviews} />
          </Card>
        </aside>
      </div>
    </Page>
  );
}
