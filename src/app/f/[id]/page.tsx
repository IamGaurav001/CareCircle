import { notFound } from "next/navigation";
import { CaptureOnReturn, ContributeForm } from "@/components/actions";
import { Card, LedgerTable, Page, Progress, StatusBadge } from "@/components/ui";
import { PUBLIC_STATUSES } from "@/lib/funds";
import { fundOrNotFound, getLedger, listDocuments } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

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
    <Page title={fund.title} subtitle={<StatusBadge status={fund.status} />}>
      {token && <CaptureOnReturn orderId={token} cancelled={!PayerID} />}

      <Card>
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-6">{fund.purpose}</p>
          <p className="rounded-lg border border-success px-3 py-2 text-sm">
            <span className="font-medium text-success">Verified:</span> a CareCircle reviewer checked the hospital
            estimate and approved {formatUsd(approvedCents)}. Money is paid only to{" "}
            <span className="font-medium">{fund.payeeName}</span>.
          </p>
          <Progress raisedCents={ledger.raisedCents} approvedCents={approvedCents} />
        </div>
      </Card>

      {fund.status === "open" && remainingCents > 0 && (
        <Card title="Contribute">
          <ContributeForm fundId={fund.id} remainingCents={remainingCents} />
        </Card>
      )}
      {fund.status === "open" && remainingCents === 0 && (
        <Card>
          <p className="text-sm">This fund has everything it needs. Thank you!</p>
        </Card>
      )}

      {fund.status === "closed" && (
        <Card title="Final report">
          <ul className="flex flex-col gap-1.5 text-sm">
            <li>
              Raised <span className="font-semibold">{formatUsd(ledger.raisedCents)}</span> of{" "}
              {formatUsd(approvedCents)} approved.
            </li>
            <li>
              Paid <span className="font-semibold">{formatUsd(ledger.paidOutCents)}</span> to {fund.payeeName}.
            </li>
            <li>
              {receipts.length} receipt{receipts.length === 1 ? "" : "s"} checked by the reviewer.
            </li>
            <li>
              Left in the fund: <span className="font-semibold">{formatUsd(ledger.balanceCents)}</span>.
            </li>
          </ul>
          <p className="mt-3 text-xs text-muted">Every figure comes from the ledger below.</p>
        </Card>
      )}

      <Card title="Ledger">
        <LedgerTable entries={ledger.entries} />
      </Card>
    </Page>
  );
}
