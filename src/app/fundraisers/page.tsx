import Link from "next/link";
import { primaryButton } from "@/components/styles";
import { EmptyState, Icon, StatusBadge } from "@/components/ui";
import { listPublicFundraisers } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

export const metadata = { title: "Donate to a hospital bill · CareCircle" };

type Fundraiser = Awaited<ReturnType<typeof listPublicFundraisers>>[number];

function FundraiserCard({ fund }: { fund: Fundraiser }) {
  const approved = fund.approvedCents ?? 0;
  const share = approved > 0 ? Math.min(1, fund.raisedCents / approved) : 0;
  const open = fund.status === "open";
  return (
    <Link
      href={`/f/${fund.id}`}
      className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-accent/40 hover:shadow-lg hover:shadow-black/[0.04]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
          <Icon name="shield" className="h-3.5 w-3.5" /> Bill verified
        </span>
        {!open && <StatusBadge status={fund.status} />}
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold leading-snug group-hover:text-accent">{fund.title}</h2>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Icon name="hospital" className="h-4 w-4 shrink-0" /> Paid only to {fund.payeeName}
        </p>
      </div>
      <p className="line-clamp-3 text-sm leading-6 text-muted">{fund.purpose}</p>
      <div className="mt-auto flex flex-col gap-2">
        <div className="h-2 overflow-hidden rounded-full bg-subtle">
          <div className="h-full rounded-full bg-accent" style={{ width: `${share * 100}%` }} />
        </div>
        <div className="flex items-baseline justify-between text-sm">
          <span>
            <span className="font-semibold tabular-nums">{formatUsd(fund.raisedCents)}</span>{" "}
            <span className="text-muted">of {formatUsd(approved)}</span>
          </span>
          <span className="text-muted">
            {fund.donations} {fund.donations === 1 ? "donation" : "donations"}
          </span>
        </div>
      </div>
      {open && (
        <span className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-accent/30 bg-accent-soft py-2.5 text-sm font-semibold text-accent transition group-hover:bg-accent group-hover:text-accent-foreground">
          Donate <Icon name="arrowRight" className="h-4 w-4" />
        </span>
      )}
    </Link>
  );
}

// Anyone can find a fundraiser here and donate, without an account.
export default async function Fundraisers() {
  const fundraisers = await listPublicFundraisers();
  const open = fundraisers.filter((fund) => fund.status === "open");
  const done = fundraisers.filter((fund) => fund.status !== "open");

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:py-14">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Help pay a hospital bill</h1>
        <p className="max-w-2xl text-lg leading-8 text-muted">
          Every bill here has been checked, and every dollar goes straight to the hospital named on it. You do not need an
          account: pick a fundraiser, choose an amount, and pay with PayPal or a card.
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          {["Checked bills only", "Paid straight to the hospital", "Refunded if the fundraiser is cancelled"].map((point) => (
            <li key={point} className="flex items-center gap-1.5">
              <Icon name="check" className="h-4 w-4 text-success" /> {point}
            </li>
          ))}
        </ul>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Collecting donations now</h2>
        {open.length === 0 ? (
          <EmptyState
            title="No fundraisers are collecting right now"
            action={
              <Link href="/signup" className={primaryButton}>
                Start a fundraiser
              </Link>
            }
          >
            If your family needs help with a hospital bill, you can start one in a few minutes.
          </EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {open.map((fund) => (
              <li key={fund.id}>
                <FundraiserCard fund={fund} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Recently funded</h2>
            <p className="text-sm text-muted">These are no longer taking donations. Open one to see where the money went.</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {done.map((fund) => (
              <li key={fund.id}>
                <FundraiserCard fund={fund} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
