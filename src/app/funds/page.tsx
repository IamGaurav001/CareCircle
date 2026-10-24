import Link from "next/link";
import { primaryButton } from "@/components/styles";
import { EmptyState, Icon, Page, StatusBadge, TrustTrack } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import type { Fund } from "@/lib/funds";
import { listFundsByOwner } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

// What the family should do next, in a few words, for each stage.
const TODO: Record<Fund["status"], string> = {
  draft: "Upload the bill and check it",
  in_review: "Our team is checking it, within 24 hours",
  rejected: "Not approved. Open it to see why",
  open: "Share your link, or send the money to the hospital",
  releasing: "PayPal is sending the money to the hospital",
  receipts_due: "Upload the hospital's receipt",
  closed: "Complete. Thank you!",
  cancelled: "Cancelled. Every donation is refunded",
};

export default async function MyFunds() {
  const user = await requirePageRole("family");
  const funds = await listFundsByOwner(user.id);
  const newButton = (
    <Link href="/funds/new" className={primaryButton}>
      <Icon name="plus" className="h-4 w-4" />
      New fundraiser
    </Link>
  );

  return (
    <Page
      title="My fundraisers"
      description={`Hello, ${user.name}. Each fundraiser is for one hospital bill. Open one to see what to do next.`}
      actions={funds.length > 0 ? newButton : undefined}
    >
      {funds.length === 0 ? (
        <EmptyState title="You have no fundraisers yet" action={newButton}>
          Start one for a hospital bill. You will upload the bill, a reviewer will approve it, and then you can share a
          link with your family.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {funds.map((fund) => (
            <li key={fund.id}>
              <Link
                href={`/funds/${fund.id}`}
                className="group flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-accent/50 hover:shadow-md hover:shadow-black/[0.03]"
              >
                <div className="flex flex-col gap-2">
                  <StatusBadge status={fund.status} />
                  <h2 className="text-lg font-semibold leading-snug group-hover:text-accent">{fund.title}</h2>
                  <p className="text-sm text-muted">
                    {formatUsd(fund.approvedCents ?? fund.requestedCents)} {fund.approvedCents != null ? "approved" : "requested"} · paid
                    to {fund.payeeName}
                  </p>
                </div>
                <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
                  <TrustTrack status={fund.status} compact />
                  <span className="flex items-center justify-between gap-2 text-sm font-medium">
                    {TODO[fund.status]}
                    <Icon name="arrowRight" className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
