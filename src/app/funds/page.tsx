import Link from "next/link";
import { Page, StatusBadge, TrustTrack } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import { listFundsByOwner } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

export default async function MyFunds() {
  const user = await requirePageRole("family");
  const funds = await listFundsByOwner(user.id);

  return (
    <Page
      eyebrow={`Namaste, ${user.name}`}
      title="Your funds"
      subtitle="One fund for each hospital bill. Money is paid only to the hospital you name."
      actions={
        <Link href="/funds/new" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition hover:brightness-110">
          Start a fund
        </Link>
      }
    >
      {funds.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-semibold">Start with the hospital estimate</h2>
          <p className="max-w-md text-sm text-muted">
            Create a fund, upload the estimate, and AI will explain every charge. A reviewer verifies it before relatives
            can pay.
          </p>
          <Link href="/funds/new" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground">
            Start a fund
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {funds.map((fund) => (
            <li key={fund.id}>
              <Link
                href={`/funds/${fund.id}`}
                className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-lg hover:shadow-black/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold leading-snug group-hover:text-accent">{fund.title}</h2>
                  <StatusBadge status={fund.status} />
                </div>
                <p className="text-sm text-muted">
                  {formatUsd(fund.approvedCents ?? fund.requestedCents)} {fund.approvedCents != null ? "verified" : "asked"} ·{" "}
                  {fund.payeeName}
                </p>
                <div className="mt-auto">
                  <TrustTrack status={fund.status} compact />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
