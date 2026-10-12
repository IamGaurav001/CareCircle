import Link from "next/link";
import { Page, StatusBadge, TrustTrack } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import type { Fund } from "@/lib/funds";
import { listFundsForReview } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

// Grouped by what the reviewer has to do next.
const GROUPS: { title: string; hint: string; statuses: Fund["status"][]; urgent?: boolean }[] = [
  { title: "Needs your decision", hint: "Check the bill and approve an amount or reject", statuses: ["in_review"], urgent: true },
  { title: "Ready to release", hint: "Raised money waiting to go to the hospital", statuses: ["open", "releasing"], urgent: true },
  { title: "Waiting for receipts", hint: "Hospital paid; confirm receipts to close", statuses: ["receipts_due"] },
  { title: "Done", hint: "Completed or not approved", statuses: ["closed", "rejected"] },
];

export default async function ReviewQueue() {
  const user = await requirePageRole("reviewer");
  const funds = await listFundsForReview();
  const grouped = GROUPS.map((group) => ({ ...group, funds: funds.filter((fund) => group.statuses.includes(fund.status)) }));

  return (
    <Page eyebrow={`Signed in as ${user.name}`} title="Review queue" subtitle="You approve every step that opens or moves money. AI flags and rule checks inform you; they never decide.">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {grouped.map((group) => (
          <div key={group.title} className={`rounded-2xl border p-4 ${group.urgent && group.funds.length > 0 ? "border-marigold/40 bg-marigold-soft" : "border-border bg-card"}`}>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{group.title}</dt>
            <dd className="font-display text-3xl font-semibold">{group.funds.length}</dd>
          </div>
        ))}
      </dl>

      {grouped.map((group) => (
        <section key={group.title} className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">{group.title}</h2>
            <p className="text-sm text-muted">{group.hint}</p>
          </div>
          {group.funds.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">Nothing here right now.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {group.funds.map((fund) => (
                <li key={fund.id}>
                  <Link
                    href={`/review/${fund.id}`}
                    className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-accent"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold group-hover:text-accent">{fund.title}</span>
                      <span className="text-sm text-muted">
                        {formatUsd(fund.requestedCents)} asked · pays {fund.payeeName}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <TrustTrack status={fund.status} compact />
                      <StatusBadge status={fund.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </Page>
  );
}
