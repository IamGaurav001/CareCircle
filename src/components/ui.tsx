import Link from "next/link";
import type { AiFlag, LineItem } from "@/lib/db/schema";
import type { CheckResult, Fund } from "@/lib/funds";
import { formatBill, formatUsd } from "@/lib/money";

// Shared presentational pieces for the screens. No data fetching here.

export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <circle cx="16" cy="16" r="8" fill="none" stroke="var(--accent-foreground)" strokeWidth="2.5" strokeDasharray="38 12.3" strokeLinecap="round" transform="rotate(-50 16 16)" />
      <circle cx="16" cy="16" r="2.6" fill="var(--accent-foreground)" />
    </svg>
  );
}

// Simple line icons, drawn on a 24-unit grid.
const ICONS = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6L6 18",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4",
  shield: "M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6zM9 12l2 2 4-4",
  users:
    "M16 20v-1.5A3.5 3.5 0 0 0 12.5 15h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.2a3.5 3.5 0 0 1 0 6.6",
  hospital: "M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M2 21h20M12 7v6M9 10h6M10 21v-4h4v4",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowLeft: "M19 12H5M11 6l-6 6 6 6",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z",
  alert: "M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16v-4M12 8h.01",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  link: "M10 14a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 10a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  plus: "M12 5v14M5 12h14",
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  );
}

const STATUS: Record<Fund["status"], { label: string; tone: string; dot: string }> = {
  draft: { label: "Draft", tone: "bg-subtle text-muted", dot: "bg-muted" },
  in_review: { label: "Waiting for review", tone: "bg-info-soft text-info", dot: "bg-info" },
  rejected: { label: "Not approved", tone: "bg-danger-soft text-danger", dot: "bg-danger" },
  open: { label: "Accepting payments", tone: "bg-accent-soft text-accent", dot: "bg-accent" },
  releasing: { label: "Paying the hospital", tone: "bg-info-soft text-info", dot: "bg-info" },
  receipts_due: { label: "Waiting for receipt", tone: "bg-warning-soft text-warning", dot: "bg-warning" },
  closed: { label: "Completed", tone: "bg-success-soft text-success", dot: "bg-success" },
  cancelled: { label: "Cancelled and refunded", tone: "bg-subtle text-foreground", dot: "bg-muted" },
};

export function StatusBadge({ status }: { status: Fund["status"] }) {
  const { label, tone, dot } = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}

// The five stages every fundraiser moves through, shown on every fundraiser page.
const TRACK = [
  { label: "Bill uploaded", detail: "The AI explains each charge" },
  { label: "Bill approved", detail: "A reviewer checks it" },
  { label: "Family pays", detail: "Through PayPal, from anywhere" },
  { label: "Hospital paid", detail: "Money goes directly to it" },
  { label: "Receipt shared", detail: "Proof for everyone who paid" },
];

const TRACK_POSITION: Record<Fund["status"], number> = {
  draft: 0,
  in_review: 1,
  rejected: 1,
  open: 2,
  releasing: 3,
  receipts_due: 4,
  closed: 5,
  cancelled: 2,
};

const STOPPED: Partial<Record<Fund["status"], string>> = {
  rejected: "Stopped: the bill was not approved",
  cancelled: "Stopped: cancelled, and every payment refunded",
};

export function TrustTrack({ status, compact = false }: { status: Fund["status"]; compact?: boolean }) {
  const current = TRACK_POSITION[status];
  const stopped = status in STOPPED;

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1" aria-hidden>
          {TRACK.map((step, i) => (
            <span
              key={step.label}
              className={`h-1.5 flex-1 rounded-full ${
                i < current ? "bg-accent" : i === current && stopped ? "bg-danger" : i === current ? "bg-accent/35" : "bg-subtle"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted">
          {STOPPED[status] ?? (current >= 5 ? "All 5 stages done" : `Stage ${current + 1} of 5: ${TRACK[current].label.toLowerCase()}`)}
        </span>
      </div>
    );
  }

  return (
    <ol className="grid grid-cols-5 gap-2" aria-label="Progress of this fundraiser">
      {TRACK.map((step, i) => {
        const done = i < current;
        const active = i === current && current < 5;
        return (
          <li key={step.label} className="flex flex-col gap-2" aria-current={active ? "step" : undefined}>
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-accent text-accent-foreground"
                    : active && stopped
                      ? "bg-danger text-white"
                      : active
                        ? "border-2 border-accent bg-card text-accent"
                        : "border border-border bg-card text-muted"
                }`}
              >
                {done ? <Icon name="check" className="h-4 w-4" /> : stopped && active ? <Icon name="x" className="h-4 w-4" /> : i + 1}
              </span>
              {i < TRACK.length - 1 && <span className={`h-0.5 flex-1 rounded-full ${done ? "bg-accent" : "bg-border"}`} />}
            </div>
            <div>
              <div className={`text-xs font-semibold leading-tight sm:text-sm ${done || active ? "text-foreground" : "text-muted"}`}>{step.label}</div>
              <div className="mt-0.5 hidden text-xs text-muted sm:block">{step.detail}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function VerifiedSeal({ approvedCents }: { approvedCents: number }) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 self-start rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
      <Icon name="shield" className="h-4 w-4" />
      Bill checked by a reviewer · {formatUsd(approvedCents)} approved
    </span>
  );
}

export function Card({
  title,
  description,
  children,
  aside,
  tone = "plain",
}: {
  title?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
  tone?: "plain" | "accent" | "warning" | "danger";
}) {
  const toneClass = {
    plain: "border-border bg-card",
    accent: "border-accent/40 bg-card",
    warning: "border-warning/30 bg-warning-soft",
    danger: "border-danger/30 bg-danger-soft",
  }[tone];
  return (
    <section className={`rounded-xl border p-5 sm:p-6 ${toneClass}`}>
      {(title || aside || description) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Page({
  back,
  title,
  description,
  badge,
  actions,
  children,
}: {
  back?: { href: string; label: string };
  title: string;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-3">
        {back && (
          <Link href={back.href} className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-muted hover:text-foreground">
            <Icon name="arrowLeft" className="h-4 w-4" />
            {back.label}
          </Link>
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex max-w-2xl flex-col gap-2">
            {badge && <div>{badge}</div>}
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            {description && <p className="text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
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
      {large ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span>
            <span className="text-3xl font-semibold tracking-tight tabular-nums">{formatUsd(raisedCents)}</span>
            <span className="ml-1.5 text-sm text-muted">raised</span>
          </span>
          <span className="text-sm text-muted">of {formatUsd(approvedCents)} needed</span>
        </div>
      ) : (
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground">{formatUsd(raisedCents)}</span> raised of {formatUsd(approvedCents)}
        </p>
      )}
      <div
        className={`${large ? "h-2.5" : "h-2"} overflow-hidden rounded-full bg-subtle`}
        role="progressbar"
        aria-valuenow={Math.round(share * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Share of the approved amount raised"
      >
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${share * 100}%` }} />
      </div>
      {large && <p className="text-sm text-muted">{Math.round(share * 100)}% of the approved amount</p>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
      {hint && <dd className="text-xs text-muted">{hint}</dd>}
    </div>
  );
}

const NOTICE_TONE = {
  info: { box: "border-info/25 bg-info-soft", icon: "text-info", name: "info" },
  accent: { box: "border-accent/40 bg-card", icon: "text-accent", name: "arrowRight" },
  success: { box: "border-success/25 bg-success-soft", icon: "text-success", name: "check" },
  warning: { box: "border-warning/25 bg-warning-soft", icon: "text-warning", name: "clock" },
  danger: { box: "border-danger/25 bg-danger-soft", icon: "text-danger", name: "alert" },
} as const;

/** A short message with a title: what is happening, or what to do next. */
export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: keyof typeof NOTICE_TONE;
  title?: string;
  children: React.ReactNode;
}) {
  const style = NOTICE_TONE[tone];
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${style.box}`}>
      <span className={`mt-0.5 shrink-0 ${style.icon}`}>
        <Icon name={style.name} className="h-5 w-5" />
      </span>
      <div className="flex flex-col gap-0.5 leading-6">
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-foreground/85">{children}</div>
      </div>
    </div>
  );
}

const FLAG_LABEL: Record<AiFlag["kind"], string> = {
  unclear_item: "Unclear charge",
  total_mismatch: "Total does not add up",
  unreadable: "Hard to read",
  other: "Worth checking",
};

/** What the AI read from a bill or receipt. */
export function ExtractionView({
  extraction,
}: {
  extraction: {
    lineItems: LineItem[];
    statedTotalMinor: number | null;
    currency: string | null;
    providerName?: string | null;
    explanation: string;
    flags: AiFlag[];
  };
}) {
  const { lineItems, statedTotalMinor, currency, providerName, explanation, flags } = extraction;
  const sum = lineItems.reduce((total, item) => total + item.amountMinor, 0);
  const matches = statedTotalMinor == null || statedTotalMinor === sum;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 rounded-xl bg-subtle p-4">
        <span className="mt-0.5 shrink-0 text-accent">
          <Icon name="sparkle" className="h-5 w-5" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-muted">Summary written by AI</p>
          <p className="text-sm leading-6">{explanation}</p>
          <p className="text-sm">
            <span className="text-muted">Issued by:</span>{" "}
            <span className="font-medium">{providerName ?? "No hospital name found"}</span>
          </p>
        </div>
      </div>
      {flags.length > 0 && (
        <ul className="flex flex-col gap-2">
          {flags.map((flag, i) => (
            <li key={i} className="flex gap-2.5 rounded-xl border border-warning/25 bg-warning-soft px-3.5 py-2.5 text-sm">
              <span className="mt-0.5 shrink-0 text-warning">
                <Icon name="alert" className="h-4 w-4" />
              </span>
              <span>
                <span className="font-semibold">{FLAG_LABEL[flag.kind]}:</span> {flag.message}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 font-semibold">Charge and what it means</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, i) => (
              <tr key={i} className="border-b border-border/70 align-top">
                <td className="py-3 pr-4">
                  <div className="font-medium">{item.description}</div>
                  <div className="text-muted">{item.explanation}</div>
                </td>
                <td className="py-3 text-right tabular-nums">{formatBill(item.amountMinor, currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-3 text-muted">Charges add up to</td>
              <td className="pt-3 text-right font-semibold tabular-nums">{formatBill(sum, currency)}</td>
            </tr>
            {statedTotalMinor != null && (
              <tr>
                <td className="pt-1 text-muted">Total printed on the bill</td>
                <td className={`pt-1 text-right font-semibold tabular-nums ${matches ? "" : "text-danger"}`}>
                  {formatBill(statedTotalMinor, currency)}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-muted">The AI only reads and explains. A person makes every decision.</p>
    </div>
  );
}

/** The code's rule checks; a failed one is shown to the reviewer, never decided by the code. */
export function ChecksList({ checks }: { checks: CheckResult[] }) {
  return (
    <ul className="flex flex-col gap-2.5 text-sm">
      {checks.map((check) => (
        <li key={check.check} className="flex items-start gap-2.5">
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              check.ok ? "bg-success-soft text-success" : check.blocking ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"
            }`}
          >
            <Icon name={check.ok ? "check" : check.blocking ? "x" : "alert"} className="h-3.5 w-3.5" />
          </span>
          <span className="leading-6">{check.message}</span>
        </li>
      ))}
    </ul>
  );
}

const ENTRY_LABEL = { contribution: "Payment from family", payout: "Paid to the hospital", refund: "Refund" } as const;

function entryLabel(type: keyof typeof ENTRY_LABEL, name: string | null | undefined): string {
  if (type === "contribution") return name ?? "Anonymous";
  if (type === "refund") return `Refunded to ${name ?? "an anonymous supporter"}`;
  return ENTRY_LABEL[type];
}

/** Every payment in and out. Every amount on the site comes from these entries. */
export function LedgerTable({
  entries,
}: {
  entries: {
    id: string;
    type: keyof typeof ENTRY_LABEL;
    amountCents: number;
    createdAt: Date;
    contributorName?: string | null;
    message?: string | null;
  }[];
}) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
        No payments yet. Each payment will appear here as soon as it arrives.
      </p>
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-border">
      {entries.map((entry) => {
        const out = entry.amountCents < 0;
        const icon = entry.type === "payout" ? "hospital" : entry.type === "refund" ? "arrowLeft" : "heart";
        return (
          <li key={entry.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="flex min-w-0 gap-3">
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  entry.type === "payout" ? "bg-info-soft text-info" : entry.type === "refund" ? "bg-subtle text-muted" : "bg-accent-soft text-accent"
                }`}
              >
                <Icon name={icon} className="h-4 w-4" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="font-medium">{entryLabel(entry.type, entry.contributorName)}</span>
                {entry.type === "contribution" && entry.message && <span className="text-sm text-muted">&ldquo;{entry.message}&rdquo;</span>}
                <span className="text-xs text-muted">
                  {entry.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>
            </div>
            <span className={`shrink-0 font-semibold tabular-nums ${out ? "text-foreground" : "text-success"}`}>
              {out ? "−" : "+"}
              {formatUsd(Math.abs(entry.amountCents))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const STAGE_LABEL = { fund: "Bill review", release: "Payment to the hospital", receipts: "Hospital receipt", cancel: "Fundraiser" } as const;

function decisionText(stage: keyof typeof STAGE_LABEL, approved: boolean): string {
  if (stage === "cancel") return "cancelled, and every payment refunded";
  if (approved) return "approved";
  return stage === "receipts" ? "more receipts requested" : "not approved";
}

export function ReviewHistory({
  reviews,
}: {
  reviews: { stage: keyof typeof STAGE_LABEL; decision: "approve" | "reject"; note: string | null; createdAt: Date; reviewer: string }[];
}) {
  if (reviews.length === 0) return <p className="text-sm text-muted">No decisions yet.</p>;
  return (
    <ol className="flex flex-col gap-4 text-sm">
      {reviews.map((review, i) => {
        const approved = review.decision === "approve";
        return (
          <li key={i} className="flex gap-3">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                approved ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
              }`}
            >
              <Icon name={approved ? "check" : "x"} className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">
                {STAGE_LABEL[review.stage]}: {decisionText(review.stage, approved)}
              </span>
              <span className="text-xs text-muted">
                {review.reviewer} · {review.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </span>
              {review.note && <p className="mt-1 rounded-lg bg-subtle px-3 py-2">&ldquo;{review.note}&rdquo;</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Opens the uploaded bill or receipt itself, through a short-lived private link. */
export function FileLink({ documentId, label = "Open the original file" }: { documentId: string; label?: string }) {
  return (
    <a
      href={`/api/documents/${documentId}/file`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent underline-offset-4 hover:underline"
    >
      {label}
      <Icon name="external" className="h-4 w-4" />
    </a>
  );
}

/** A dashed box for lists with nothing in them yet. */
export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children && <div className="max-w-md text-sm text-muted">{children}</div>}
      {action}
    </div>
  );
}

/** The frame for sign-in and account pages: one card, a title, and a line below it. */
export function AuthCard({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        {children}
      </div>
      {footer && <div className="text-center text-sm text-muted">{footer}</div>}
    </div>
  );
}
