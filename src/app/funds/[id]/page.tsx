import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton, UploadForm } from "@/components/actions";
import { Card, ChecksList, ExtractionView, LedgerTable, Page, Progress, ReviewHistory, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import { runChecks } from "@/lib/funds";
import { fundOrNotFound, getLedger, listDocuments, listReviews } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

const NEXT_STEP = {
  draft: "Upload the hospital estimate. When the AI has read it, check the explanation and submit the fund for review.",
  in_review: "A reviewer is checking the estimate. You will see the decision here.",
  rejected: "The reviewer did not approve this fund. Their reason is below.",
  open: "Share the public page with relatives. Contributions appear in the ledger as they arrive.",
  releasing: "The reviewer has released the money to the hospital. PayPal is confirming the payment.",
  receipts_due: "The hospital has been paid. Upload the receipts so the reviewer can close the fund.",
  closed: "The fund is closed. The public page shows the final report.",
} as const;

export default async function FamilyFund({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageRole("family");
  const { id } = await params;
  const fund = await fundOrNotFound(id);
  if (fund.ownerId !== user.id) notFound();

  const [estimates, receipts, reviews, ledger] = await Promise.all([
    listDocuments(fund.id, "estimate"),
    listDocuments(fund.id, "receipt"),
    listReviews(fund.id),
    getLedger(fund.id),
  ]);
  const extraction = estimates.find((item) => item.extraction)?.extraction ?? null;
  const checks = fund.status === "draft" ? await runChecks(fund) : [];
  const isPublic = ["open", "releasing", "receipts_due", "closed"].includes(fund.status);

  return (
    <Page title={fund.title} subtitle={<StatusBadge status={fund.status} />}>
      <p className="rounded-xl border border-accent bg-card p-4 text-sm">{NEXT_STEP[fund.status]}</p>

      <Card title="The need">
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Asked for</dt>
            <dd className="font-medium">{formatUsd(fund.requestedCents)}</dd>
          </div>
          <div>
            <dt className="text-muted">Approved</dt>
            <dd className="font-medium">{fund.approvedCents != null ? formatUsd(fund.approvedCents) : "Not yet"}</dd>
          </div>
          <div>
            <dt className="text-muted">Paid to</dt>
            <dd className="font-medium">{fund.payeeName}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-muted">{fund.purpose}</p>
      </Card>

      {isPublic && (
        <Card title="Contributions" aside={<Link href={`/f/${fund.id}`} className="text-sm text-accent underline">Public page</Link>}>
          <div className="flex flex-col gap-4">
            <Progress raisedCents={ledger.raisedCents} approvedCents={fund.approvedCents ?? 0} />
            <LedgerTable entries={ledger.entries} />
          </div>
        </Card>
      )}

      <Card title="Hospital estimate">
        <div className="flex flex-col gap-4">
          {extraction ? (
            <ExtractionView extraction={extraction} />
          ) : (
            <p className="text-sm text-muted">
              {estimates.length > 0 ? "The estimate is uploaded but has not been read yet." : "No estimate uploaded yet."}
            </p>
          )}
          {fund.status === "draft" && <UploadForm url={`/api/funds/${fund.id}/documents`} label="Upload estimate" />}
        </div>
      </Card>

      {fund.status === "draft" && (
        <Card title="Before you submit">
          <div className="flex flex-col gap-4">
            <ChecksList checks={checks} />
            <ActionButton url={`/api/funds/${fund.id}/submit`} label="Submit for review" pendingLabel="Submitting…" />
          </div>
        </Card>
      )}

      {(fund.status === "receipts_due" || receipts.length > 0) && (
        <Card title="Receipts">
          <div className="flex flex-col gap-4">
            {receipts.length === 0 ? (
              <p className="text-sm text-muted">No receipts uploaded yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {receipts.map(({ document, extraction: read }) => (
                  <li key={document.id} className="rounded-lg border border-border p-3 text-sm">
                    {read ? <ExtractionView extraction={read} /> : <span className="text-muted">Uploaded, not read yet.</span>}
                  </li>
                ))}
              </ul>
            )}
            {fund.status === "receipts_due" && <UploadForm url={`/api/funds/${fund.id}/receipts`} label="Upload receipt" />}
          </div>
        </Card>
      )}

      <Card title="Reviewer decisions">
        <ReviewHistory reviews={reviews} />
      </Card>
    </Page>
  );
}
