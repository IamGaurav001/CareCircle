import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ActionButton,
  DraftControls,
  ShareLink,
  UploadForm,
} from "@/components/actions";
import { textLink } from "@/components/styles";
import {
  Card,
  ChecksList,
  ExtractionView,
  FileLink,
  Icon,
  LedgerTable,
  Notice,
  Page,
  Progress,
  ReviewHistory,
  Stat,
  StatusBadge,
  TrustTrack,
} from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import { PUBLIC_STATUSES, runChecks, type Fund } from "@/lib/funds";
import {
  fundOrNotFound,
  getLedger,
  listDocuments,
  listReviews,
} from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

type Next = {
  tone: "accent" | "info" | "warning" | "danger" | "success";
  title: string;
  text: string;
};

const NEXT_STEP: Record<Exclude<Fund["status"], "draft">, Next> = {
  in_review: {
    tone: "info",
    title: "A reviewer is checking your bill",
    text: "You do not need to do anything now. The decision will appear on this page.",
  },
  rejected: {
    tone: "danger",
    title: "Your bill was not approved",
    text: "The reviewer's reason is under Decisions. You can start a new fundraiser with a corrected bill.",
  },
  open: {
    tone: "accent",
    title: "Share your link with family",
    text: "Your bill is approved, so relatives can now pay. Each payment appears in the payment history below.",
  },
  releasing: {
    tone: "info",
    title: "The hospital is being paid",
    text: "The reviewer has sent the money and PayPal is confirming it. You do not need to do anything now.",
  },
  receipts_due: {
    tone: "warning",
    title: "Upload the hospital's receipt",
    text: "The hospital has been paid. Ask its billing desk for a receipt and upload it below, so everyone can see the money paid the bill.",
  },
  closed: {
    tone: "success",
    title: "This fundraiser is complete",
    text: "The hospital was paid and the receipt was accepted. Relatives can see the final report on the public page.",
  },
};

export default async function FamilyFund({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
  const isDraft = fund.status === "draft";
  const checks = isDraft ? await runChecks(fund) : [];
  const canSubmit = checks.every((check) => check.ok || !check.blocking);
  const isPublic = PUBLIC_STATUSES.includes(fund.status);
  const next: Next =
    fund.status === "draft"
      ? extraction
        ? {
            tone: "accent",
            title: "Check the summary, then send it for review",
            text: "Read what the AI found on your bill. If it looks right, send it to a reviewer in step 2.",
          }
        : {
            tone: "accent",
            title: "Upload the hospital bill",
            text: "Add a PDF or photo of the estimate below. The AI will explain every charge.",
          }
      : NEXT_STEP[fund.status];

  return (
    <Page
      back={{ href: "/funds", label: "My fundraisers" }}
      badge={<StatusBadge status={fund.status} />}
      title={fund.title}
      description={
        <>
          Paid only to{" "}
          <span className="font-medium text-foreground">{fund.payeeName}</span>
        </>
      }
    >
      <Card>
        <TrustTrack status={fund.status} />
      </Card>
      <Notice tone={next.tone} title={next.title}>
        {next.text}
      </Notice>

      {isPublic && (
        <Card
          title="Share with family"
          description="Anyone with this link can see the fundraiser and pay. They do not need an account."
          aside={
            <Link
              href={`/f/${fund.id}`}
              className={`${textLink} inline-flex items-center gap-1 text-sm`}
            >
              See what they see <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          }
        >
          <ShareLink path={`/f/${fund.id}`} title={fund.title} />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <Card
            title={
              isDraft ? "Step 1: Upload the hospital bill" : "Hospital bill"
            }
            description={
              isDraft
                ? "The AI reads it and explains every charge. You can replace it until you send it for review."
                : undefined
            }
            aside={
              estimate ? (
                <FileLink documentId={estimate.document.id} />
              ) : undefined
            }
          >
            <div className="flex flex-col gap-5">
              {extraction ? (
                <ExtractionView extraction={extraction} />
              ) : (
                estimate && (
                  <Notice
                    tone="warning"
                    title="The AI could not read this file"
                  >
                    Try uploading it again, or upload a clearer photo.
                  </Notice>
                )
              )}
              {isDraft && (
                <UploadForm
                  url={`/api/funds/${fund.id}/documents`}
                  what="hospital bill"
                  label={estimate ? "Upload a new bill" : "Upload bill"}
                />
              )}
            </div>
          </Card>

          {isDraft && (
            <Card
              title="Step 2: Send it for review"
              description="A CareCircle reviewer checks the bill and approves an amount. You cannot edit the fundraiser after this."
            >
              <div className="flex flex-col gap-5">
                <ChecksList checks={checks} />
                {checks.some((check) => !check.ok && !check.blocking) && (
                  <p className="text-xs text-muted">
                    Items marked with a warning are shown to the reviewer. They
                    do not stop you from sending.
                  </p>
                )}
                {canSubmit && (
                  <ActionButton
                    url={`/api/funds/${fund.id}/submit`}
                    label="Send for review"
                    pendingLabel="Sending…"
                  />
                )}
              </div>
            </Card>
          )}

          {isDraft && (
            <Card
              title="Fundraiser details"
              description="You can change these until you send the fundraiser for review."
            >
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

          {(fund.status === "receipts_due" || receipts.length > 0) && (
            <Card
              title="Hospital receipt"
              description={
                fund.status === "receipts_due"
                  ? "Upload the receipt the hospital gave you after it was paid."
                  : undefined
              }
            >
              <div className="flex flex-col gap-4">
                {receipts.map(({ document, extraction: read }) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-3 rounded-xl border border-border p-4"
                  >
                    <FileLink
                      documentId={document.id}
                      label="Open the receipt"
                    />
                    {read ? (
                      <ExtractionView extraction={read} />
                    ) : (
                      <p className="text-sm text-muted">
                        Uploaded, but the AI could not read it.
                      </p>
                    )}
                  </div>
                ))}
                {fund.status === "receipts_due" && (
                  <UploadForm
                    url={`/api/funds/${fund.id}/receipts`}
                    what="hospital receipt"
                    label="Upload receipt"
                  />
                )}
              </div>
            </Card>
          )}

          {isPublic && (
            <Card
              title="Payment history"
              description="Every payment in, and every payment to the hospital."
            >
              <LedgerTable entries={ledger.entries} />
            </Card>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <Card title="Summary">
            {isPublic && (
              <div className="mb-5">
                <Progress
                  raisedCents={ledger.raisedCents}
                  approvedCents={fund.approvedCents ?? 0}
                />
              </div>
            )}
            <dl className="grid grid-cols-2 gap-4">
              <Stat
                label="You asked for"
                value={formatUsd(fund.requestedCents)}
              />
              <Stat
                label="Approved"
                value={
                  fund.approvedCents != null
                    ? formatUsd(fund.approvedCents)
                    : "Not yet"
                }
              />
              <Stat label="Raised" value={formatUsd(ledger.raisedCents)} />
              <Stat
                label="Paid to hospital"
                value={formatUsd(ledger.paidOutCents)}
              />
            </dl>
            <div className="mt-5 border-t border-border pt-4 text-sm">
              <div className="text-muted">Money is paid only to</div>
              <div className="font-semibold">{fund.payeeName}</div>
              <div className="break-all text-xs text-muted">
                {fund.payeePaypalEmail}
              </div>
            </div>
          </Card>
          <Card
            title="Decisions"
            description="What the CareCircle reviewer decided, and why."
          >
            <ReviewHistory reviews={reviews} />
          </Card>
        </aside>
      </div>
    </Page>
  );
}
