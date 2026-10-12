import Link from "next/link";
import { Page, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import { listFundsByOwner } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

export default async function MyFunds() {
  const user = await requirePageRole("family");
  const funds = await listFundsByOwner(user.id);

  return (
    <Page title="My funds" subtitle="Each fund is one documented need, paid only to the approved hospital.">
      <Link href="/funds/new" className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
        New fund
      </Link>
      {funds.length === 0 ? (
        <p className="text-sm text-muted">No funds yet. Start one with your hospital estimate.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {funds.map((fund) => (
            <li key={fund.id}>
              <Link
                href={`/funds/${fund.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 hover:border-accent"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{fund.title}</span>
                  <span className="text-sm text-muted">
                    {formatUsd(fund.requestedCents)} for {fund.payeeName}
                  </span>
                </div>
                <StatusBadge status={fund.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
