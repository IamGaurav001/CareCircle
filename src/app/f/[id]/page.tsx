import { notFound } from "next/navigation";
import { CaptureOnReturn, ContributeForm } from "@/components/actions";
import { Card, Icon, type IconName, LedgerTable, Notice, Progress, Stat, TrustTrack, VerifiedSeal } from "@/components/ui";
import { PUBLIC_STATUSES, type Fund } from "@/lib/funds";
import { fundOrNotFound, getLedger, listDocuments } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

const PROMISES: { icon: IconName; text: string }[] = [
  { icon: "shield", text: "A CareCircle reviewer checked the hospital bill before this page opened." },
  { icon: "lock", text: "Your money is held safely until the reviewer sends it to the hospital." },
  { icon: "hospital", text: "It can only be paid to the hospital named here, and never more than the approved amount." },
  { icon: "eye", text: "Every payment in and out is listed on this page, and the hospital's receipt is checked at the end." },
  { icon: "arrowLeft", text: "If the fundraiser is cancelled before the hospital is paid, every payment is returned in full." },
];

const CLOSED_MESSAGE: Partial<Record<Fund["status"], { title: string; text: string }>> = {
  releasing: { title: "The hospital is being paid", text: "The money raised is on its way to the hospital, so this fundraiser no longer accepts payments." },
  receipts_due: { title: "The hospital has been paid", text: "The family will upload the hospital's receipt next. This fundraiser no longer accepts payments." },
  closed: { title: "This fundraiser is complete", text: "The hospital was paid and a reviewer accepted its receipt. Thank you to everyone who helped." },
  cancelled: {
    title: "This fundraiser was cancelled",
    text: "Every payment is being returned in full through PayPal. Each refund appears in the payment history.",
  },
};

// The page relatives see: the verified need, the live payment history, and the PayPal button.
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
  const supporters = ledger.entries.filter((entry) => entry.type === "contribution").length;
  const closedMessage = CLOSED_MESSAGE[fund.status];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:py-12">
      {token && <CaptureOnReturn orderId={token} cancelled={!PayerID} />}

      <div className="flex max-w-3xl flex-col gap-3">
        <VerifiedSeal approvedCents={approvedCents} />
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{fund.title}</h1>
        <p className="flex items-center gap-2 text-muted">
          <Icon name="hospital" className="h-5 w-5 shrink-0" />
          <span>
            Money goes only to <span className="font-semibold text-foreground">{fund.payeeName}</span>
          </span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <Card title="Why the family needs help">
            <p className="whitespace-pre-line leading-7">{fund.purpose}</p>
          </Card>

          <Card title="Where things stand">
            <TrustTrack status={fund.status} />
          </Card>

          {fund.status === "closed" && (
            <Card title="Final report" description="Every number here comes from the payment history below." tone="accent">
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Raised" value={formatUsd(ledger.raisedCents)} />
                <Stat label="Paid to hospital" value={formatUsd(ledger.paidOutCents)} />
                <Stat label="Receipts checked" value={receipts.length} />
                <Stat label="Left over" value={formatUsd(ledger.balanceCents)} />
              </dl>
            </Card>
          )}

          <Card
            title="Payment history"
            description={supporters > 0 ? `${supporters} ${supporters === 1 ? "person has" : "people have"} helped so far.` : "Every payment in and out is shown here."}
          >
            <LedgerTable entries={ledger.entries} />
          </Card>
        </div>

        {/* On phones the payment box comes first; on wide screens it sits on the right. */}
        <aside className="order-first flex flex-col gap-6 lg:sticky lg:top-24 lg:order-none">
          <Card>
            <div className="flex flex-col gap-5">
              {fund.status === "cancelled" ? (
                <dl className="grid grid-cols-2 gap-4">
                  <Stat label="Raised" value={formatUsd(ledger.raisedCents)} />
                  <Stat label="Refunded" value={formatUsd(ledger.refundedCents)} />
                </dl>
              ) : (
                <Progress raisedCents={ledger.raisedCents} approvedCents={approvedCents} large />
              )}
              {fund.status === "open" && remainingCents > 0 && (
                <div className="border-t border-border pt-5">
                  <ContributeForm fundId={fund.id} remainingCents={remainingCents} paypalClientId={process.env.PAYPAL_CLIENT_ID ?? null} />
                </div>
              )}
              {fund.status === "open" && remainingCents === 0 && (
                <Notice tone="success" title="Fully funded">
                  The whole approved amount has been raised. Thank you to everyone who helped.
                </Notice>
              )}
              {closedMessage && (
                <Notice tone={fund.status === "closed" ? "success" : fund.status === "cancelled" ? "warning" : "info"} title={closedMessage.title}>
                  {closedMessage.text}
                </Notice>
              )}
            </div>
          </Card>
          <Card title="Why you can trust this page">
            <ul className="flex flex-col gap-3">
              {PROMISES.map((promise) => (
                <li key={promise.text} className="flex gap-3 text-sm leading-6">
                  <span className="mt-0.5 shrink-0 text-accent">
                    <Icon name={promise.icon} className="h-5 w-5" />
                  </span>
                  {promise.text}
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </main>
  );
}
