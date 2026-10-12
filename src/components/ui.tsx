import type { AiFlag, LineItem } from "@/lib/db/schema";
import type { CheckResult, Fund } from "@/lib/funds";
import { formatBill, formatUsd } from "@/lib/money";

// Shared presentational pieces for the screens. No data fetching here.

export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="12" fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeDasharray="56 20" strokeLinecap="round" transform="rotate(-60 16 16)" />
      <circle cx="16" cy="16" r="4.5" fill="var(--marigold)" />
    </svg>
  );
}

const STATUS: Record<Fund["status"], { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "bg-border/60 text-muted" },
  in_review: { label: "Being verified", tone: "bg-warning-soft text-warning" },
  rejected: { label: "Not approved", tone: "bg-danger-soft text-danger" },
  open: { label: "Raising funds", tone: "bg-accent-soft text-accent" },
  releasing: { label: "Paying hospital", tone: "bg-warning-soft text-warning" },
  receipts_due: { label: "Receipts due", tone: "bg-marigold-soft text-marigold" },
  closed: { label: "Completed", tone: "bg-success-soft text-success" },
};

export function StatusBadge({ status }: { status: Fund["status"] }) {
  const { label, tone } = STATUS[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

// The trust track: the five promises every fund moves through, shown on every fund page.
const TRACK = [
  { label: "Bill explained", detail: "AI reads the estimate" },
  { label: "Verified", detail: "A reviewer approves it" },
  { label: "Funded", detail: "Relatives pay via PayPal" },
  { label: "Hospital paid", detail: "Only the approved payee" },
  { label: "Receipts checked", detail: "The loop is closed" },
];

const TRACK_POSITION: Record<Fund["status"], number> = {
  draft: 0,
  in_review: 1,
  rejected: 1,
  open: 2,
  releasing: 3,
  receipts_due: 4,
  closed: 5,
};

export function TrustTrack({ status, compact = false }: { status: Fund["status"]; compact?: boolean }) {
  const current = TRACK_POSITION[status];
  const stopped = status === "rejected";

  if (compact) {
    return (
      <div className="flex items-center gap-1" aria-label={`Step ${Math.min(current + 1, 5)} of 5`}>
        {TRACK.map((step, i) => (
          <span
            key={step.label}
            className={`h-1.5 w-6 rounded-full ${
              i < current ? "bg-accent" : i === current && !stopped ? "bg-marigold" : i === current ? "bg-danger" : "bg-border"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <ol className="grid grid-cols-5 gap-1">
      {TRACK.map((step, i) => {
        const done = i < current;
        const active = i === current && current < 5;
        return (
          <li key={step.label} className="flex flex-col gap-2">
            <div className="flex items-center">
              <span
                className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-accent text-accent-foreground"
                    : active && stopped
                      ? "bg-danger text-card"
                      : active
                        ? "bg-marigold text-card"
                        : "border border-border bg-card text-muted"
                }`}
              >
                {active && !stopped && (
                  <span className="absolute inset-0 rounded-full bg-marigold/40 motion-safe:animate-ping" aria-hidden />
                )}
                <span className="relative">{done ? "✓" : stopped && active ? "×" : i + 1}</span>
              </span>
              {i < TRACK.length - 1 && <span className={`h-0.5 flex-1 ${done ? "bg-accent" : "bg-border"}`} />}
            </div>
            <div className="pr-2">
              <div className={`text-xs font-semibold sm:text-sm ${done || active ? "text-foreground" : "text-muted"}`}>
                {step.label}
              </div>
              <div className="hidden text-xs text-muted sm:block">{step.detail}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function VerifiedSeal({ approvedCents }: { approvedCents: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-success/40 bg-success-soft px-3 py-1.5 text-sm text-success">
      <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
        <path fill="currentColor" d="M10 1.5l2.2 1.6 2.7-.2.8 2.6 2.2 1.6-.9 2.6.9 2.6-2.2 1.6-.8 2.6-2.7-.2L10 18.5l-2.2-1.6-2.7.2-.8-2.6L2.1 13l.9-2.6-.9-2.6 2.2-1.6.8-2.6 2.7.2z" />
        <path fill="none" stroke="var(--card)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M6.5 10.2l2.3 2.3 4.7-4.8" />
      </svg>
      <span className="font-semibold">Verified</span>
      <span className="text-success/80">for {formatUsd(approvedCents)}</span>
    </div>
  );
}

export function Card({
  title,
  eyebrow,
  children,
  aside,
  tone = "plain",
}: {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  tone?: "plain" | "accent" | "warning" | "danger";
}) {
  const toneClass = {
    plain: "border-border bg-card",
    accent: "border-accent/30 bg-accent-soft",
    warning: "border-warning/30 bg-warning-soft",
    danger: "border-danger/30 bg-danger-soft",
  }[tone];
  return (
    <section className={`rounded-2xl border p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6 ${toneClass}`}>
      {(title || aside || eyebrow) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{eyebrow}</div>}
            {title && <h2 className="font-display text-xl font-semibold">{title}</h2>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Page({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          {eyebrow && <div className="text-sm text-muted">{eyebrow}</div>}
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          {subtitle && <div className="text-muted">{subtitle}</div>}
        </div>
        {actions}
      </div>
      {children}
    </main>
  );
}

/** Raised so far against the approved amount. */
export function Progress({ raisedCents, approvedCents, large = false }: { raisedCents: number; approvedCents: number; large?: boolean }) {
  const share = approvedCents > 0 ? Math.min(1, raisedCents / approvedCents) : 0;
  return (
    <div className="flex flex-col gap-2">
      {large && (
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-3xl font-semibold tabular-nums">{formatUsd(raisedCents)}</span>
          <span className="text-sm text-muted">of {formatUsd(approvedCents)}</span>
        </div>
      )}
      <div className={`${large ? "h-3" : "h-2"} overflow-hidden rounded-full bg-border`}>
        <div className="h-full rounded-full bg-gradient-to-r from-accent to-marigold transition-[width]" style={{ width: `${share * 100}%` }} />
      </div>
      {!large && (
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground">{formatUsd(raisedCents)}</span> raised of {formatUsd(approvedCents)}
        </p>
      )}
      {large && <p className="text-sm text-muted">{Math.round(share * 100)}% of the verified amount</p>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
      {hint && <dd className="text-xs text-muted">{hint}</dd>}
    </div>
  );
}

const FLAG_LABEL: Record<AiFlag["kind"], string> = {
  unclear_item: "Unclear item",
  total_mismatch: "Total does not add up",
  unreadable: "Hard to read",
  other: "Worth a look",
};

/** What the AI read from a bill or receipt. */
export function ExtractionView({
  extraction,
}: {
  extraction: { lineItems: LineItem[]; statedTotalMinor: number | null; currency: string | null; explanation: string; flags: AiFlag[] };
}) {
  const { lineItems, statedTotalMinor, currency, explanation, flags } = extraction;
  const sum = lineItems.reduce((total, item) => total + item.amountMinor, 0);
  const matches = statedTotalMinor == null || statedTotalMinor === sum;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 rounded-xl bg-accent-soft p-4">
        <span className="mt-0.5 shrink-0 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
          AI
        </span>
        <p className="text-sm leading-6">{explanation}</p>
      </div>
      {flags.length > 0 && (
        <ul className="flex flex-col gap-2">
          {flags.map((flag, i) => (
            <li key={i} className="flex gap-2 rounded-xl border border-warning/30 bg-warning-soft px-3 py-2 text-sm">
              <span aria-hidden className="font-bold text-warning">!</span>
              <span>
                <span className="font-semibold text-warning">{FLAG_LABEL[flag.kind]}.</span> {flag.message}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
              <th className="py-2 font-semibold">Charge, and what it means</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, i) => (
              <tr key={i} className="border-b border-dashed border-border align-top">
                <td className="py-3 pr-3">
                  <div className="font-medium">{item.description}</div>
                  <div className="text-muted">{item.explanation}</div>
                </td>
                <td className="py-3 text-right font-mono tabular-nums">{formatBill(item.amountMinor, currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-3 text-muted">Charges add up to</td>
              <td className="pt-3 text-right font-mono font-semibold tabular-nums">{formatBill(sum, currency)}</td>
            </tr>
            {statedTotalMinor != null && (
              <tr>
                <td className="pt-1 text-muted">Total printed on the bill</td>
                <td className={`pt-1 text-right font-mono font-semibold tabular-nums ${matches ? "" : "text-danger"}`}>
                  {formatBill(statedTotalMinor, currency)}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/** The code's rule checks; a failed one is shown to the reviewer, never decided by the code. */
export function ChecksList({ checks }: { checks: CheckResult[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {checks.map((check) => (
        <li key={check.check} className="flex items-start gap-2.5">
          <span
            aria-hidden
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              check.ok ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
            }`}
          >
            {check.ok ? "✓" : "!"}
          </span>
          <span>{check.message}</span>
        </li>
      ))}
    </ul>
  );
}

const ENTRY_LABEL = { contribution: "Contribution received", payout: "Paid to hospital", refund: "Refund" } as const;

/** The ledger, styled like a printed receipt. Every amount on the site comes from here. */
export function LedgerTable({
  entries,
}: {
  entries: { id: string; type: keyof typeof ENTRY_LABEL; amountCents: number; createdAt: Date }[];
}) {
  if (entries.length === 0) {
    return <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted">No money has moved yet.</p>;
  }
  return (
    <div className="rounded-xl border border-dashed border-border bg-background/60 p-4 font-mono text-sm">
      <ul className="flex flex-col">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-baseline justify-between gap-3 border-b border-dashed border-border py-2 last:border-0">
            <span className="flex flex-col">
              <span className="font-sans font-medium">{ENTRY_LABEL[entry.type]}</span>
              <span className="text-xs text-muted">
                {entry.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </span>
            <span className={`font-semibold tabular-nums ${entry.amountCents < 0 ? "text-danger" : "text-success"}`}>
              {entry.amountCents < 0 ? "−" : "+"}
              {formatUsd(Math.abs(entry.amountCents))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STAGE_LABEL = { fund: "Fund review", release: "Release to hospital", receipts: "Receipts" } as const;

export function ReviewHistory({
  reviews,
}: {
  reviews: { stage: keyof typeof STAGE_LABEL; decision: "approve" | "reject"; note: string | null; createdAt: Date; reviewer: string }[];
}) {
  if (reviews.length === 0) return <p className="text-sm text-muted">No decisions yet.</p>;
  return (
    <ol className="relative flex flex-col gap-4 border-l border-border pl-5 text-sm">
      {reviews.map((review, i) => {
        const approved = review.decision === "approve";
        return (
          <li key={i} className="relative">
            <span className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-card ${approved ? "bg-success" : "bg-danger"}`} aria-hidden />
            <div className="font-semibold">
              {STAGE_LABEL[review.stage]}:{" "}
              <span className={approved ? "text-success" : "text-danger"}>
                {approved ? "approved" : review.stage === "receipts" ? "asked for more" : "not approved"}
              </span>
            </div>
            <div className="text-xs text-muted">
              {review.reviewer} · {review.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </div>
            {review.note && <p className="mt-1 rounded-lg bg-background px-3 py-2 text-muted">“{review.note}”</p>}
          </li>
        );
      })}
    </ol>
  );
}

export function NextStep({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "warning" | "danger" | "success" }) {
  const toneClass = {
    accent: "border-accent/30 bg-accent-soft",
    warning: "border-warning/30 bg-warning-soft",
    danger: "border-danger/30 bg-danger-soft",
    success: "border-success/30 bg-success-soft",
  }[tone];
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${toneClass}`}>
      <span className="mt-0.5 text-xs font-bold uppercase tracking-wider text-muted">Next</span>
      <p className="leading-6">{children}</p>
    </div>
  );
}
