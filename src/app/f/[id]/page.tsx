import { notFound } from "next/navigation";
import { CaptureOnReturn, ContributeForm } from "@/components/actions";
import { Card, LedgerTable, Progress, Stat, StatusBadge, TrustTrack, VerifiedSeal } from "@/components/ui";
import { PUBLIC_STATUSES } from "@/lib/funds";
import { fundOrNotFound, getLedger, listDocuments } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

const PROMISES = [
  "A reviewer checked the hospital's estimate before this page opened.",
  "Your money is held in the fund until the reviewer releases it.",
  "It can only be paid to the hospital named here, and never more than the verified amount.",
  "Every payment in and out is listed below, and the receipts are checked at the end.",
];

// The page relatives see: the verified need, the live ledger, and the PayPal button.
// PayPal sends contributors back here with ?token=<order id>, and the page takes the payment.
export default async function PublicFund({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; PayerID?: string }>;
}) {
  const fund = await fundOrNotFound((await params).id);
  if (!PUBLIC_STATUSES.includes(fund.status)) notFound();
  const { token, PayerID } = await searchParams;

  const [ledger, receipts] = await Promise.all([getLedger(fund.id), listDocuments(fund.id, "receipt")]);
  const approvedCents = fund.approvedCents ?? 0;
  const remainingCents = Math.max(0, approvedCents - ledger.raisedCents);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:py-12">
      {token && <CaptureOnReturn orderId={token} cancelled={!PayerID} />}

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <VerifiedSeal approvedCents={approvedCents} />
          <StatusBadge status={fund.status} />
        </div>
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{fund.title}</h1>
        <p className="text-muted">
          Paid only to <span className="font-semibold text-foreground">{fund.payeeName}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <Card>
            <TrustTrack status={fund.status} />
          </Card>

          <Card title="About this need">
            <p className="leading-7">{fund.purpose}</p>
          </Card>

          {fund.status === "closed" && (
            <Card title="Final report" tone="accent">
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Raised" value={formatUsd(ledger.raisedCents)} />
                <Stat label="Paid to hospital" value={formatUsd(ledger.paidOutCents)} />
                <Stat label="Receipts checked" value={receipts.length} />
                <Stat label="Left in fund" value={formatUsd(ledger.balanceCents)} />
              </dl>
              <p className="mt-4 text-xs text-muted">Every figure is computed from the ledger below.</p>
            </Card>
          )}

          <Card title="Where the money went" eyebrow="Public ledger">
            <LedgerTable entries={ledger.entries} />
          </Card>
        </div>

        {/* On phones the contribute box comes first; on wide screens it sits on the right. */}
        <aside className="order-first flex flex-col gap-6 lg:sticky lg:top-24 lg:order-none">
          <Card>
            <div className="flex flex-col gap-5">
              <Progress raisedCents={ledger.raisedCents} approvedCents={approvedCents} large />
              {fund.status === "open" && remainingCents > 0 && <ContributeForm fundId={fund.id} remainingCents={remainingCents} />}
              {fund.status === "open" && remainingCents === 0 && (
                <p className="rounded-xl bg-success-soft p-3 text-sm text-success">This fund has everything it needs. Thank you!</p>
              )}
              {fund.status !== "open" && (
                <p className="rounded-xl bg-background p-3 text-sm text-muted">This fund is no longer taking contributions.</p>
              )}
            </div>
          </Card>
          <Card title="Why you can trust this">
            <ul className="flex flex-col gap-3">
              {PROMISES.map((promise) => (
                <li key={promise} className="flex gap-2.5 text-sm leading-6">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-soft text-[10px] text-success" aria-hidden>
                    ✓
                  </span>
                  {promise}
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </main>
  );
}
