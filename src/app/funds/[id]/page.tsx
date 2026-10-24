import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton, CancelForm, DraftControls, PayoutWatcher, ShareLink, ShareMessageWriter, UploadForm } from "@/components/actions";
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
import { fundOrNotFound, getLatestPayout, getLedger, listDocuments, listReviews } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

type Next = { tone: "accent" | "info" | "warning" | "danger" | "success"; title: string; text: string };

const NEXT_STEP: Partial<Record<Fund["status"], Next>> = {
  in_review: {
    tone: "info",
    title: "Our review team is taking a closer look",
    text: "The automatic check found something a person should see (it is listed below). A member of the CareCircle team will check your bill within 24 hours. You will see the result on this page, and you do not need to do anything now.",
  },
  rejected: {
    tone: "danger",
    title: "We could not approve this bill",
    text: "The reason is in the history below. If something was wrong, start a new fundraiser with the corrected bill or details.",
  },
  open: {
    tone: "accent",
    title: "Your fundraiser is live. Share it with family",
    text: "Send the link to everyone who wants to help. Each donation appears below as it arrives. When the hospital needs the money, send it from this page.",
  },
  releasing: {
    tone: "info",
    title: "PayPal is sending the money to the hospital",
    text: "This usually takes a few seconds, and sometimes a few minutes. This page updates by itself.",
  },
  closed: {
    tone: "success",
    title: "Done. The hospital was paid and the receipt was accepted",
    text: "Thank you for trusting CareCircle. Everyone who donated can see the hospital's receipt and the final numbers on your fundraiser page.",
  },
  cancelled: {
    tone: "danger",
    title: "This fundraiser was cancelled",
    text: "Every donation is being returned in full through PayPal. The reason is in the history below.",
  },
};

export default async function FamilyFund({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageRole("family");
  const { id } = await params;
  const fund = await fundOrNotFound(id);
  if (fund.ownerId !== user.id) notFound();

  const [estimates, receipts, reviews, ledger, payout] = await Promise.all([
    listDocuments(fund.id, "estimate"),
    listDocuments(fund.id, "receipt"),
    listReviews(fund.id),
    getLedger(fund.id),
    getLatestPayout(fund.id),
  ]);
  // The newest upload is the estimate; an older reading never stands in for it.
  const estimate = estimates[0] ?? null;
  const extraction = estimate?.extraction ?? null;
  const isDraft = fund.status === "draft";
  const checks = isDraft || fund.status === "in_review" ? await runChecks(fund) : [];
  const canSubmit = checks.every((check) => check.ok || !check.blocking);
  const isPublic = PUBLIC_STATUSES.includes(fund.status);
  const balanceCents = ledger.balanceCents;
  const sendableCents = Math.min(balanceCents, (fund.approvedCents ?? 0) - ledger.paidOutCents);
  const donations = ledger.entries.filter((entry) => entry.type === "contribution").length;
  const receiptWaiting = fund.status === "receipts_due" && receipts.length > 0;

  const next: Next = isDraft
    ? extraction
      ? {
          tone: "accent",
          title: "Almost there: check your bill",
          text: "Read what the AI found on your bill. If it looks right, press \"Check my bill\" in step 2.",
        }
      : {
          tone: "accent",
          title: "First, upload the hospital bill",
          text: "Add a photo or PDF of the estimate the hospital gave you. The AI will explain every charge.",
        }
    : fund.status === "receipts_due"
      ? receiptWaiting
        ? {
            tone: "info",
            title: "Our team is checking your receipt",
            text: "The automatic check could not confirm it on its own, so a member of the CareCircle team will look within 24 hours. You can also upload another copy below.",
          }
        : {
            tone: "warning",
            title: "Last step: upload the hospital's receipt",
            text: "The money reached the hospital. Ask its billing desk for a receipt and upload it below, so everyone who donated can see it paid the bill.",
          }
      : NEXT_STEP[fund.status]!;

  return (
    <Page
      back={{ href: "/funds", label: "My fundraisers" }}
      badge={<StatusBadge status={fund.status} />}
      title={fund.title}
      description={
        <>
          Paid only to <span className="font-medium text-foreground">{fund.payeeName}</span>
        </>
      }
    >
      <Card>
        <TrustTrack status={fund.status} />
      </Card>
      <Notice tone={next.tone} title={next.title}>
        {next.text}
      </Notice>

      {isPublic && fund.status !== "cancelled" && (
        <Card
          title="Share with family"
          description="Anyone with this link can see your fundraiser and donate. They do not need an account."
          aside={
            <Link href={`/f/${fund.id}`} className={`${textLink} inline-flex items-center gap-1 text-sm`}>
              See your fundraiser page <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          }
        >
          <div className="flex flex-col gap-4">
            <ShareLink path={`/f/${fund.id}`} title={fund.title} />
            {fund.status === "open" && <ShareMessageWriter fundId={fund.id} />}
          </div>
        </Card>
      )}

      {fund.status === "open" && (
        <Card
          title="Send the money to the hospital"
          description="Do this when the hospital needs to be paid. You can send what has come in so far, even if the goal is not reached."
        >
          {sendableCents > 0 ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 rounded-xl border border-border bg-subtle/60 p-4 text-sm">
                <span>
                  <span className="text-2xl font-semibold tabular-nums">{formatUsd(sendableCents)}</span>{" "}
                  <span className="text-muted">
                    from {donations} {donations === 1 ? "donation" : "donations"}
                  </span>
                </span>
                <span className="text-muted">
                  Goes only to <span className="font-medium text-foreground">{fund.payeeName}</span> at {fund.payeePaypalEmail}, through
                  PayPal.
                </span>
              </div>
              <ActionButton
                url={`/api/funds/${fund.id}/release`}
                label={`Send ${formatUsd(sendableCents)} to the hospital`}
                pendingLabel="Sending to PayPal…"
                confirm={`Send ${formatUsd(sendableCents)} to ${fund.payeeName} now? After this, the fundraiser stops taking donations.`}
              />
              <p className="text-xs text-muted">After you send it, the fundraiser stops taking donations, and you upload the hospital&apos;s receipt.</p>
            </div>
          ) : (
            <p className="text-sm text-muted">Nothing to send yet. As soon as the first donation arrives, you can send it from here.</p>
          )}
        </Card>
      )}

      {fund.status === "releasing" && (
        <Card title="Sending to the hospital">
          <PayoutWatcher fundId={fund.id} />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="flex flex-col gap-6">
          {fund.status === "in_review" && (
            <Card title="What our team is checking" description="These are the results of the automatic check. Anything not ticked is what the team will look at.">
              <ChecksList checks={checks} />
            </Card>
          )}

          <Card
            title={isDraft ? "Step 1: Upload the hospital bill" : "Hospital bill"}
            description={isDraft ? "The AI reads it and explains every charge. You can replace it until you check it in step 2." : undefined}
            aside={estimate ? <FileLink documentId={estimate.document.id} /> : undefined}
          >
            <div className="flex flex-col gap-5">
              {extraction ? (
                <ExtractionView extraction={extraction} />
              ) : (
                estimate && (
                  <Notice tone="warning" title="The AI could not read this file">
                    Try uploading it again, or upload a clearer photo.
                  </Notice>
                )
              )}
              {extraction && extraction.questions.length > 0 && (
                <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Icon name="sparkle" className="h-4 w-4 text-accent" />
                    Questions you could ask the hospital&apos;s billing desk
                  </p>
                  <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-6">
                    {extraction.questions.map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted">Suggested by AI from your bill. They may help you lower the bill or understand it.</p>
                </div>
              )}
              {isDraft && (
                <UploadForm url={`/api/funds/${fund.id}/documents`} what="hospital bill" label={estimate ? "Upload a new bill" : "Upload bill"} />
              )}
            </div>
          </Card>

          {isDraft && (
            <Card
              title="Step 2: Check my bill"
              description="We check your bill automatically, in under a minute. If everything matches, your fundraiser goes live straight away. If something needs a closer look, a member of our review team checks it within 24 hours."
            >
              <div className="flex flex-col gap-5">
                <ChecksList checks={checks} />
                {checks.some((check) => !check.ok && !check.blocking) && (
                  <p className="text-xs text-muted">
                    You can still continue. Items with a warning go to our review team instead of opening straight away. If one
                    is a mistake, such as the hospital&apos;s name, fix it in the details below first.
                  </p>
                )}
                {canSubmit && (
                  <ActionButton url={`/api/funds/${fund.id}/submit`} label="Check my bill" pendingLabel="Checking your bill…" />
                )}
              </div>
            </Card>
          )}

          {isDraft && (
            <Card title="Fundraiser details" description="You can change these until your bill is checked.">
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
                  ? "We check the receipt automatically. If it is from the hospital that was paid, your fundraiser is complete."
                  : undefined
              }
            >
              <div className="flex flex-col gap-4">
                {payout?.status === "unclaimed" && fund.status === "receipts_due" && (
                  <Notice tone="info" title="The hospital needs to accept the payment">
                    PayPal sent the money to {fund.payeePaypalEmail}, which does not have a PayPal account yet. PayPal has emailed
                    the hospital, and holds the money for it for 30 days.
                  </Notice>
                )}
                {receipts.map(({ document, extraction: read }) => (
                  <div key={document.id} className="flex flex-col gap-3 rounded-xl border border-border p-4">
                    <FileLink documentId={document.id} label="Open the receipt" />
                    {read ? <ExtractionView extraction={read} /> : <p className="text-sm text-muted">Uploaded, but the AI could not read it.</p>}
                  </div>
                ))}
                {fund.status === "receipts_due" && (
                  <UploadForm
                    url={`/api/funds/${fund.id}/receipts`}
                    what="hospital receipt"
                    label={receipts.length > 0 ? "Upload another receipt" : "Upload receipt"}
                  />
                )}
              </div>
            </Card>
          )}

          {isPublic && (
            <Card title="Donations" description="Every donation, and every payment to the hospital.">
              <LedgerTable entries={ledger.entries} />
            </Card>
          )}

          {fund.status === "open" && (
            <Card title="Need to stop?" description="If the treatment is cancelled, you can close the fundraiser. Every donation goes back in full.">
              <CancelForm fundId={fund.id} payments={donations} />
            </Card>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <Card title="Summary">
            {isPublic && fund.status !== "cancelled" && (
              <div className="mb-5">
                <Progress raisedCents={ledger.raisedCents} approvedCents={fund.approvedCents ?? 0} />
              </div>
            )}
            <dl className="grid grid-cols-2 gap-4">
              <Stat label="You asked for" value={formatUsd(fund.requestedCents)} />
              <Stat label="Approved" value={fund.approvedCents != null ? formatUsd(fund.approvedCents) : "Not yet"} />
              <Stat label="Donated" value={formatUsd(ledger.raisedCents)} />
              <Stat label="Sent to hospital" value={formatUsd(ledger.paidOutCents)} />
              {ledger.refundedCents > 0 && <Stat label="Refunded" value={formatUsd(ledger.refundedCents)} />}
            </dl>
            <div className="mt-5 border-t border-border pt-4 text-sm">
              <div className="text-muted">Money is paid only to</div>
              <div className="font-semibold">{fund.payeeName}</div>
              <div className="break-all text-xs text-muted">{fund.payeePaypalEmail}</div>
            </div>
          </Card>
          <Card title="History" description="Every check and decision on this fundraiser.">
            <ReviewHistory reviews={reviews} />
          </Card>
        </aside>
      </div>
    </Page>
  );
}
