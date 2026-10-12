import type { AiFlag, LineItem } from "@/lib/db/schema";
import type { CheckResult, Fund } from "@/lib/funds";
import { formatBill, formatUsd } from "@/lib/money";

// Shared presentational pieces for the screens. No data fetching here.

const STATUS: Record<Fund["status"], { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "border-border text-muted" },
  in_review: { label: "In review", tone: "border-warning text-warning" },
  rejected: { label: "Rejected", tone: "border-danger text-danger" },
  open: { label: "Open for contributions", tone: "border-accent text-accent" },
  releasing: { label: "Releasing", tone: "border-warning text-warning" },
  receipts_due: { label: "Receipts due", tone: "border-warning text-warning" },
  closed: { label: "Closed", tone: "border-success text-success" },
};

export function StatusBadge({ status }: { status: Fund["status"] }) {
  const { label, tone } = STATUS[status];
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}>{label}</span>;
}

export function Card({ title, children, aside }: { title?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      {(title || aside) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Page({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <div className="text-sm text-muted">{subtitle}</div>}
      </div>
      {children}
    </main>
  );
}

/** Raised so far against the approved amount, as a bar. */
export function Progress({ raisedCents, approvedCents }: { raisedCents: number; approvedCents: number }) {
  const share = approvedCents > 0 ? Math.min(1, raisedCents / approvedCents) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-2.5 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-accent" style={{ width: `${share * 100}%` }} />
      </div>
      <p className="text-sm text-muted">
        <span className="font-semibold text-foreground">{formatUsd(raisedCents)}</span> raised of{" "}
        {formatUsd(approvedCents)} approved
      </p>
    </div>
  );
}

const FLAG_LABEL: Record<AiFlag["kind"], string> = {
  unclear_item: "Unclear item",
  total_mismatch: "Total does not add up",
  unreadable: "Hard to read",
  other: "Note",
};

/** What the AI read from a bill or receipt. */
export function ExtractionView({
  extraction,
}: {
  extraction: { lineItems: LineItem[]; statedTotalMinor: number | null; currency: string | null; explanation: string; flags: AiFlag[] };
}) {
  const { lineItems, statedTotalMinor, currency, explanation, flags } = extraction;
  const sum = lineItems.reduce((total, item) => total + item.amountMinor, 0);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-6">{explanation}</p>
      {flags.length > 0 && (
        <ul className="flex flex-col gap-2">
          {flags.map((flag, i) => (
            <li key={i} className="rounded-lg border border-warning px-3 py-2 text-sm">
              <span className="font-medium text-warning">{FLAG_LABEL[flag.kind]}:</span> {flag.message}
            </li>
          ))}
        </ul>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, i) => (
            <tr key={i} className="border-b border-border align-top">
              <td className="py-2 pr-3">
                <div className="font-medium">{item.description}</div>
                <div className="text-muted">{item.explanation}</div>
              </td>
              <td className="py-2 text-right tabular-nums">{formatBill(item.amountMinor, currency)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="py-2 text-muted">Items add up to</td>
            <td className="py-2 text-right font-medium tabular-nums">{formatBill(sum, currency)}</td>
          </tr>
          {statedTotalMinor != null && (
            <tr>
              <td className="py-1 text-muted">Total printed on the bill</td>
              <td className="py-1 text-right font-medium tabular-nums">{formatBill(statedTotalMinor, currency)}</td>
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
}

/** The code's rule checks; a failed one is shown to the reviewer, never decided by the code. */
export function ChecksList({ checks }: { checks: CheckResult[] }) {
  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {checks.map((check) => (
        <li key={check.check} className="flex gap-2">
          <span aria-hidden className={check.ok ? "text-success" : "text-warning"}>
            {check.ok ? "✓" : "!"}
          </span>
          <span>{check.message}</span>
        </li>
      ))}
    </ul>
  );
}

const ENTRY_LABEL = { contribution: "Contribution", payout: "Paid to payee", refund: "Refund" } as const;

export function LedgerTable({
  entries,
}: {
  entries: { id: string; type: keyof typeof ENTRY_LABEL; amountCents: number; createdAt: Date }[];
}) {
  if (entries.length === 0) return <p className="text-sm text-muted">No money has moved yet.</p>;
  return (
    <table className="w-full text-sm">
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id} className="border-b border-border last:border-0">
            <td className="py-2">{ENTRY_LABEL[entry.type]}</td>
            <td className="py-2 text-muted">{entry.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
            <td className={`py-2 text-right font-medium tabular-nums ${entry.amountCents < 0 ? "text-danger" : "text-success"}`}>
              {entry.amountCents < 0 ? "−" : "+"}
              {formatUsd(Math.abs(entry.amountCents))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const STAGE_LABEL = { fund: "Fund review", release: "Release", receipts: "Receipts" } as const;

export function ReviewHistory({
  reviews,
}: {
  reviews: { stage: keyof typeof STAGE_LABEL; decision: "approve" | "reject"; note: string | null; createdAt: Date; reviewer: string }[];
}) {
  if (reviews.length === 0) return <p className="text-sm text-muted">No decisions yet.</p>;
  return (
    <ul className="flex flex-col gap-3 text-sm">
      {reviews.map((review, i) => (
        <li key={i} className="flex flex-col gap-0.5">
          <div>
            <span className="font-medium">{STAGE_LABEL[review.stage]}:</span>{" "}
            <span className={review.decision === "approve" ? "text-success" : "text-danger"}>
              {review.decision === "approve" ? "approved" : review.stage === "receipts" ? "asked for more" : "rejected"}
            </span>{" "}
            <span className="text-muted">
              by {review.reviewer}, {review.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>
          {review.note && <p className="text-muted">“{review.note}”</p>}
        </li>
      ))}
    </ul>
  );
}
