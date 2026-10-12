import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton, CopyLink, DraftControls, UploadForm } from "@/components/actions";
import {
  Card,
  ChecksList,
  ExtractionView,
  FileLink,
  LedgerTable,
  NextStep,
  Page,
  Progress,
  ReviewHistory,
  Stat,
  StatusBadge,
  TrustTrack,
} from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import { runChecks } from "@/lib/funds";
import { fundOrNotFound, getLedger, listDocuments, listReviews } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

const NEXT_STEP = {
  draft: { tone: "accent", text: "Upload the hospital bill. When the AI has explained it, read the explanation and send it for checking." },
  in_review: { tone: "warning", text: "A reviewer is checking the estimate and the AI's flags. You will see the decision here." },
  rejected: { tone: "danger", text: "The reviewer did not approve this fund. Their reason is in the decisions below." },
  open: { tone: "accent", text: "Your bill is approved. Copy the link and send it to family on WhatsApp; each payment shows up below." },
  releasing: { tone: "warning", text: "The reviewer released the money to the hospital. PayPal is confirming the payment." },
  receipts_due: { tone: "warning", text: "The hospital has been paid. Upload the hospital's receipt so the reviewer can close the fund." },
  closed: { tone: "success", text: "Completed. Relatives can see the final report on the public page." },
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
  // The newest upload is the estimate; an older reading never stands in for it.
  const estimate = estimates[0] ?? null;
  const extraction = estimate?.extraction ?? null;
  const checks = fund.status === "draft" ? await runChecks(fund) : [];
  const isPublic = ["open", "releasing", "receipts_due", "closed"].includes(fund.status);
  const next = NEXT_STEP[fund.status];

  return (
    <Page
      eyebrow={<Link href="/funds" className="hover:text-accent">← Your fundraisers</Link>}
      title={fund.title}
      subtitle={<StatusBadge status={fund.status} />}
      actions={isPublic ? <CopyLink path={`/f/${fund.id}`} /> : undefined}
    >
      <Card>
        <TrustTrack status={fund.status} />
      </Card>
      <NextStep tone={next.tone}>{next.text}</NextStep>
      {fund.status === "draft" && (
        <Card title="Details" eyebrow="You can change these until you send it for checking">
          <DraftControls
            fundId={fund.id}
            initial={{
              title: fund.title,
              purpose: fund.purpose,
              payeeName: fund.payeeName,
              payeePaypalEmail: fund.payeePaypalEmail,
              requestedCents: fund.requestedCents,
            }}
          />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card eyebrow="Step 1" title="Hospital estimate">
            <div className="flex flex-col gap-5">
              {estimate && <FileLink documentId={estimate.document.id} />}
              {extraction ? (
                <ExtractionView extraction={extraction} />
              ) : (
                <p className="text-sm text-muted">
                  {estimates.length > 0 ? "The estimate is uploaded but the AI could not read it yet. Try uploading it again." : "No estimate uploaded yet."}
                </p>
              )}
              {fund.status === "draft" && <UploadForm url={`/api/funds/${fund.id}/documents`} label={extraction ? "Replace estimate" : "Upload estimate"} />}
            </div>
          </Card>

          {fund.status === "draft" && (
            <Card eyebrow="Step 2" title="Check and submit">
              <div className="flex flex-col gap-5">
                <ChecksList checks={checks} />
                <p className="text-xs text-muted">Anything marked ! is shown to the reviewer; it does not stop you from submitting.</p>
                <div className="self-start">
                  <ActionButton url={`/api/funds/${fund.id}/submit`} label="Send for checking" pendingLabel="Sending…" />
                </div>
              </div>
            </Card>
          )}

          {(fund.status === "receipts_due" || receipts.length > 0) && (
            <Card eyebrow="Last step" title="Hospital receipt">
              <div className="flex flex-col gap-4">
                {receipts.length === 0 ? (
                  <p className="text-sm text-muted">No receipts uploaded yet.</p>
                ) : (
                  receipts.map(({ document, extraction: read }) => (
                    <div key={document.id} className="rounded-xl border border-border p-4">
                      <div className="mb-3"><FileLink documentId={document.id} /></div>
                    {read ? <ExtractionView extraction={read} /> : <span className="text-sm text-muted">Uploaded; the AI could not read it.</span>}
                    </div>
                  ))
                )}
                {fund.status === "receipts_due" && <UploadForm url={`/api/funds/${fund.id}/receipts`} label="Upload receipt" />}
              </div>
            </Card>
          )}

          {isPublic && (
            <Card title="Payment history" aside={<Link href={`/f/${fund.id}`} className="text-sm font-semibold text-accent">What family sees →</Link>}>
              <LedgerTable entries={ledger.entries} />
            </Card>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <Card title="Summary">
            <dl className="grid grid-cols-2 gap-4">
              <Stat label="Asked" value={formatUsd(fund.requestedCents)} />
              <Stat label="Approved" value={fund.approvedCents != null ? formatUsd(fund.approvedCents) : "—"} />
              <Stat label="Raised" value={formatUsd(ledger.raisedCents)} />
              <Stat label="Paid to hospital" value={formatUsd(ledger.paidOutCents)} />
            </dl>
            {isPublic && (
              <div className="mt-5">
                <Progress raisedCents={ledger.raisedCents} approvedCents={fund.approvedCents ?? 0} />
              </div>
            )}
            <div className="mt-5 border-t border-border pt-4 text-sm">
              <div className="text-muted">Paid only to</div>
              <div className="font-semibold">{fund.payeeName}</div>
              <div className="break-all text-xs text-muted">{fund.payeePaypalEmail}</div>
            </div>
          </Card>
          <Card title="Reviewer decisions">
            <ReviewHistory reviews={reviews} />
          </Card>
        </aside>
      </div>
    </Page>
  );
}
