import Link from "next/link";
import { Page, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import type { Fund } from "@/lib/funds";
import { listFundsForReview } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

// Grouped by what the reviewer has to do next.
const GROUPS: { title: string; statuses: Fund["status"][] }[] = [
  { title: "Needs a decision", statuses: ["in_review"] },
  { title: "Ready to release or releasing", statuses: ["open", "releasing"] },
  { title: "Waiting for receipts", statuses: ["receipts_due"] },
  { title: "Done", statuses: ["closed", "rejected"] },
];

export default async function ReviewQueue() {
  await requirePageRole("reviewer");
  const funds = await listFundsForReview();

  return (
    <Page title="Review queue" subtitle="You approve every step that opens or moves money.">
      {GROUPS.map((group) => {
        const inGroup = funds.filter((fund) => group.statuses.includes(fund.status));
        return (
          <section key={group.title} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-muted">
              {group.title} ({inGroup.length})
            </h2>
            {inGroup.length === 0 ? (
              <p className="text-sm text-muted">Nothing here.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {inGroup.map((fund) => (
                  <li key={fund.id}>
                    <Link
                      href={`/review/${fund.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 hover:border-accent"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{fund.title}</span>
                        <span className="text-sm text-muted">
                          {formatUsd(fund.requestedCents)} asked for {fund.payeeName}
                        </span>
                      </div>
                      <StatusBadge status={fund.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </Page>
  );
}
