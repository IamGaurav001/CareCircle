import Link from "next/link";
import { ActionButton, CancelForm, ReceiptsForm, ReviewForm } from "@/components/actions";
import { textLink } from "@/components/styles";
import {
  Card,
  ChecksList,
  ExtractionView,
  FileLink,
  Icon,
  LedgerTable,
  Notice,
  Page,
  Progress,
  ReviewHistory,
  Stat,
  StatusBadge,
  TrustTrack,
} from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import { PUBLIC_STATUSES, runChecks, type Fund } from "@/lib/funds";
import { fundOrNotFound, getLatestPayout, getLedger, listDocuments, listReviews } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";
import { unrefundedContributions } from "@/lib/refunds";

const PAYOUT_STATUS: Record<string, { tone: "info" | "success" | "warning" | "danger"; text: string }> = {
  pending: { tone: "info", text: "PayPal is still processing this payment." },
  unclaimed: {
    tone: "warning",
    text: "PayPal is holding the money because the hospital's email has no PayPal account yet. The balance has not changed.",
  },
  unknown: { tone: "warning", text: "PayPal has not confirmed this payment. Check the PayPal dashboard before doing anything else." },
  succeeded: { tone: "success", text: "PayPal confirmed that the hospital received the money." },
  failed: { tone: "danger", text: "The payment failed, so the fundraiser is open again with its balance unchanged." },
};

const NEXT_STEP: Record<Fund["status"], { tone: "accent" | "info" | "warning" | "danger" | "success"; title: string; text: string }> = {
  draft: { tone: "info", title: "Not sent for review yet", text: "The family is still preparing this fundraiser. There is nothing for you to do." },
  in_review: {
    tone: "warning",
    title: "Your decision is needed",
    text: "Read the AI's summary, its warnings and the automatic checks. Then approve an amount or reject the bill with a reason.",
  },
  rejected: { tone: "danger", title: "You rejected this bill", text: "No one can pay into this fundraiser." },
  open: {
    tone: "accent",
    title: "Relatives are paying",
    text: "When the hospital needs the money, pay it from the Money section. The amount can only go to the hospital below.",
  },
  releasing: {
    tone: "info",
    title: "Payment to the hospital is in progress",
    text: "PayPal is processing it. If the status does not update by itself, ask PayPal for the latest status.",
  },
  receipts_due: {
    tone: "warning",
    title: "Check the hospital's receipt",
    text: "The hospital has been paid. When the family uploads its receipt, accept it to complete the fundraiser, or ask for more.",
  },
  closed: { tone: "success", title: "Complete", text: "The hospital was paid and you accepted its receipt. Nothing is left to do." },
  cancelled: { tone: "success", title: "Cancelled and refunded", text: "Every payment was returned to the person who made it. Nothing is left to do." },
};

export default async function ReviewFund({ params }: { params: Promise<{ id: string }> }) {
  await requirePageRole("reviewer");
  const fund = await fundOrNotFound((await params).id);

  const [estimates, receipts, reviews, ledger, payout, checks, unrefunded] = await Promise.all([
    listDocuments(fund.id, "estimate"),
    listDocuments(fund.id, "receipt"),
    listReviews(fund.id),
    getLedger(fund.id),
    getLatestPayout(fund.id),
    runChecks(fund),
    unrefundedContributions(fund.id),
  ]);
  // The newest upload is the estimate; an older reading never stands in for it.
  const estimate = estimates[0] ?? null;
  const extraction = estimate?.extraction ?? null;
  // The same limit the release route applies.
  const releasableCents = Math.min(ledger.balanceCents, (fund.approvedCents ?? 0) - ledger.paidOutCents);
  const hasMoney = PUBLIC_STATUSES.includes(fund.status);
  const next =
    fund.status === "cancelled" && unrefunded.length > 0
      ? {
          tone: "warning" as const,
          title: `${unrefunded.length} ${unrefunded.length === 1 ? "refund has" : "refunds have"} not gone through yet`,
          text: "PayPal did not confirm every refund. Try again from the Money section.",
        }
      : NEXT_STEP[fund.status];
  const payments = ledger.entries.filter((entry) => entry.type === "contribution").length;
  const payoutStatus = payout ? (PAYOUT_STATUS[payout.status] ?? { tone: "info" as const, text: payout.status }) : null;

  return (
    <Page
      back={{ href: "/review", label: "Review queue" }}
      badge={<StatusBadge status={fund.status} />}
      title={fund.title}
      description={
        <>
          {formatUsd(fund.requestedCents)} requested · paid only to <span className="font-medium text-foreground">{fund.payeeName}</span>
        </>
      }
      actions={
        hasMoney ? (
          <Link href={`/f/${fund.id}`} className={`${textLink} inline-flex items-center gap-1 text-sm`}>
            Public page <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        ) : undefined
      }
    >
      <Card>
        <TrustTrack status={fund.status} />
      </Card>
      <Notice tone={next.tone} title={next.title}>
        {next.text}
      </Notice>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="flex flex-col gap-6">
          {fund.status === "in_review" && (
            <Card title="Your decision" description="If you approve, the fundraiser opens and relatives can start paying.">
              <ReviewForm fundId={fund.id} requestedCents={fund.requestedCents} />
            </Card>
          )}

          {hasMoney && (
            <Card title="Money" description="Payments from relatives, and payments to the hospital.">
              <div className="flex flex-col gap-5">
                {fund.status === "cancelled" ? (
                  <dl className="grid grid-cols-2 gap-4">
                    <Stat label="Raised" value={formatUsd(ledger.raisedCents)} />
                    <Stat label="Refunded" value={formatUsd(ledger.refundedCents)} />
                  </dl>
                ) : (
                  <Progress raisedCents={ledger.raisedCents} approvedCents={fund.approvedCents ?? 0} large />
                )}
                {payout && payoutStatus && (
                  <Notice tone={payoutStatus.tone} title={`Payment of ${formatUsd(payout.amountCents)} to the hospital`}>
                    {payoutStatus.text}
                  </Notice>
                )}
                {fund.status === "open" &&
                  (releasableCents > 0 ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent-soft p-4">
                      <p className="text-sm leading-6">
                        This sends <span className="font-semibold">{formatUsd(releasableCents)}</span> through PayPal to{" "}
                        <span className="font-semibold">{fund.payeeName}</span> ({fund.payeePaypalEmail}). After this, the fundraiser
                        stops taking payments.
                      </p>
                      <ActionButton
                        url={`/api/funds/${fund.id}/release`}
                        label={`Pay ${formatUsd(releasableCents)} to the hospital`}
                        pendingLabel="Sending to PayPal…"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted">There is nothing to pay yet, because no money has been raised.</p>
                  ))}
                {fund.status === "cancelled" && unrefunded.length > 0 && (
                  <ActionButton url={`/api/funds/${fund.id}/cancel`} label="Retry refunds" pendingLabel="Refunding…" />
                )}
                {fund.status === "open" && (
                  <div className="border-t border-border pt-5">
                    <CancelForm fundId={fund.id} payments={payments} />
                  </div>
                )}
                {fund.status === "releasing" && (
                  <ActionButton url={`/api/funds/${fund.id}/release/sync`} label="Get the latest status from PayPal" pendingLabel="Asking PayPal…" secondary />
                )}
                <div className="border-t border-border pt-5">
                  <LedgerTable entries={ledger.entries} />
                </div>
              </div>
            </Card>
          )}

          {(fund.status === "receipts_due" || receipts.length > 0) && (
            <Card
              title={receipts.length === 1 ? "Hospital receipt" : `Hospital receipts (${receipts.length})`}
              description={fund.status === "receipts_due" && receipts.length === 0 ? "The family has not uploaded a receipt yet." : undefined}
            >
              <div className="flex flex-col gap-4">
                {receipts.map(({ document, extraction: read }) => (
                  <div key={document.id} className="flex flex-col gap-3 rounded-xl border border-border p-4">
                    <FileLink documentId={document.id} label="Open the receipt" />
                    {read ? <ExtractionView extraction={read} /> : <p className="text-sm text-muted">Uploaded, but the AI could not read it.</p>}
                  </div>
                ))}
                {fund.status === "receipts_due" && receipts.length > 0 && (
                  <div className="border-t border-border pt-5">
                    <ReceiptsForm fundId={fund.id} />
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card
            title="Hospital bill"
            description="What the AI read from the family's upload."
            aside={estimate ? <FileLink documentId={estimate.document.id} /> : undefined}
          >
            {extraction ? <ExtractionView extraction={extraction} /> : <p className="text-sm text-muted">No bill has been read yet.</p>}
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card title="The request">
            <dl className="grid grid-cols-2 gap-4">
              <Stat label="Requested" value={formatUsd(fund.requestedCents)} />
              <Stat label="Approved" value={fund.approvedCents != null ? formatUsd(fund.approvedCents) : "Not yet"} />
            </dl>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted">{fund.purpose}</p>
            <div className="mt-4 border-t border-border pt-4 text-sm">
              <div className="text-muted">Hospital (cannot be changed)</div>
              <div className="font-semibold">{fund.payeeName}</div>
              <div className="break-all text-xs text-muted">{fund.payeePaypalEmail}</div>
            </div>
          </Card>
          <Card title="Automatic checks" description="Warnings are for you to judge. They never reject a bill by themselves.">
            <ChecksList checks={checks} />
            <p className="mt-4 text-xs text-muted">The bill is in its own currency. The fundraiser is in US dollars.</p>
          </Card>
          <Card title="Decisions so far">
            <ReviewHistory reviews={reviews} />
          </Card>
        </aside>
      </div>
    </Page>
  );
}
