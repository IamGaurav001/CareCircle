import Link from "next/link";
import { Icon, Page, StatusBadge, TrustTrack } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import type { Fund } from "@/lib/funds";
import { listFundsForReview } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

// Grouped by what the reviewer has to do next.
const GROUPS: { title: string; hint: string; statuses: Fund["status"][]; urgent?: boolean }[] = [
  { title: "Bills to review", hint: "Read the bill and the AI's notes, then approve an amount or reject it.", statuses: ["in_review"], urgent: true },
  { title: "Ready to pay the hospital", hint: "Money has been raised. Send it to the hospital when it is needed.", statuses: ["open", "releasing"], urgent: true },
  { title: "Receipts to check", hint: "The hospital has been paid. Check the receipt to complete the fundraiser.", statuses: ["receipts_due"], urgent: true },
  { title: "Finished", hint: "Completed or not approved. Nothing left to do.", statuses: ["closed", "rejected"] },
];

export default async function ReviewQueue() {
  await requirePageRole("reviewer");
  const funds = await listFundsForReview();
  const grouped = GROUPS.map((group) => ({ ...group, funds: funds.filter((fund) => group.statuses.includes(fund.status)) }));
  const waiting = grouped.filter((group) => group.urgent).reduce((total, group) => total + group.funds.length, 0);

  return (
    <Page
      title="Review queue"
      description="You approve every step that opens a fundraiser or moves money. The AI's notes and the automatic checks help you decide; they never decide for you."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {grouped.map((group) => (
          <a
            key={group.title}
            href={`#${group.statuses[0]}`}
            className={`flex flex-col gap-1 rounded-xl border p-4 transition hover:border-accent/50 ${
              group.urgent && group.funds.length > 0 ? "border-warning/30 bg-warning-soft" : "border-border bg-card"
            }`}
          >
            <span className="text-sm text-muted">{group.title}</span>
            <span className="text-2xl font-semibold tabular-nums">{group.funds.length}</span>
          </a>
        ))}
      </div>
      {waiting === 0 && <p className="text-sm text-muted">Nothing is waiting for you right now.</p>}

      {grouped.map((group) => (
        <section key={group.title} id={group.statuses[0]} className="flex scroll-mt-20 flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold">{group.title}</h2>
            <p className="text-sm text-muted">{group.hint}</p>
          </div>
          {group.funds.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">Nothing here right now.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {group.funds.map((fund) => (
                <li key={fund.id}>
                  <Link
                    href={`/review/${fund.id}`}
                    className="group flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-accent/50"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="font-semibold group-hover:text-accent">{fund.title}</span>
                      <span className="text-sm text-muted">
                        {formatUsd(fund.approvedCents ?? fund.requestedCents)} {fund.approvedCents != null ? "approved" : "requested"} · paid to{" "}
                        {fund.payeeName}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden w-40 sm:block">
                        <TrustTrack status={fund.status} compact />
                      </div>
                      <StatusBadge status={fund.status} />
                      <Icon name="arrowRight" className="h-4 w-4 text-muted group-hover:text-accent" />
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
