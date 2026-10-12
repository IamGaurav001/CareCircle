"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Buttons and forms that call the API routes. The routes hold every rule; these only
// send the request and show the route's answer.

type Result = { ok: true; data: Record<string, unknown> } | { ok: false; error: string };

async function send(url: string, init: RequestInit): Promise<Result> {
  try {
    const res = await fetch(url, init);
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) return { ok: true, data };
    return { ok: false, error: typeof data.error === "string" ? data.error : `Request failed (${res.status})` };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
}

function postJson(url: string, body: unknown = {}) {
  return send(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

const button =
  "rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50";
const secondaryButton = "rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-50";
const input = "rounded-lg border border-border bg-background px-3 py-2 text-sm";

function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="text-sm text-danger">
      {error}
    </p>
  ) : null;
}

/** A button that posts to a route and refreshes the page on success. */
export function ActionButton({
  url,
  body,
  label,
  pendingLabel,
  secondary,
}: {
  url: string;
  body?: unknown;
  label: string;
  pendingLabel?: string;
  secondary?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        className={secondary ? secondaryButton : button}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await postJson(url, body);
          setPending(false);
          if (result.ok) router.refresh();
          else setError(result.error);
        }}
      >
        {pending ? (pendingLabel ?? "Working…") : label}
      </button>
      <ErrorText error={error} />
    </div>
  );
}

export function NewFundForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        setError(null);
        const result = await postJson("/api/funds", {
          title: form.get("title"),
          purpose: form.get("purpose"),
          payeeName: form.get("payeeName"),
          payeePaypalEmail: form.get("payeePaypalEmail"),
          requestedCents: Math.round(Number(form.get("requestedUsd")) * 100),
        });
        setPending(false);
        if (result.ok) router.push(`/funds/${result.data.id}`);
        else setError(result.error);
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        What is the fund for?
        <input name="title" required minLength={3} maxLength={120} placeholder="Knee surgery for my father" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Describe the need
        <textarea name="purpose" required minLength={10} maxLength={2000} rows={4} className={input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Who should be paid (hospital or clinic)
          <input name="payeeName" required minLength={2} maxLength={120} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Their PayPal email
          <input name="payeePaypalEmail" type="email" required className={input} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Amount needed (USD)
        <input name="requestedUsd" type="number" required min={1} max={100000} step="0.01" className={`${input} sm:w-48`} />
      </label>
      <ErrorText error={error} />
      <button type="submit" disabled={pending} className={`${button} self-start`}>
        {pending ? "Creating…" : "Create fund"}
      </button>
    </form>
  );
}

/** Uploads a bill or receipt to the route that stores it and has the AI read it. */
export function UploadForm({ url, label }: { url: string; label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setPending(true);
        setError(null);
        const result = await send(url, { method: "POST", body: new FormData(form) });
        setPending(false);
        if (result.ok) {
          form.reset();
          router.refresh();
        } else setError(result.error);
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <input name="file" type="file" required accept="application/pdf,image/*" className="text-sm" />
        <button type="submit" disabled={pending} className={button}>
          {pending ? "Uploading and reading…" : label}
        </button>
      </div>
      <p className="text-xs text-muted">PDF or photo. Use synthetic documents only; never upload real medical records.</p>
      <ErrorText error={error} />
    </form>
  );
}

export function ReviewForm({ fundId, requestedCents }: { fundId: string; requestedCents: number }) {
  const router = useRouter();
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const note = String(form.get("note") ?? "").trim() || undefined;
        setPending(true);
        setError(null);
        const result = await postJson(
          `/api/funds/${fundId}/review`,
          decision === "approve"
            ? { decision, note, approvedCents: Math.round(Number(form.get("approvedUsd")) * 100) }
            : { decision, note },
        );
        setPending(false);
        if (result.ok) router.refresh();
        else setError(result.error);
      }}
    >
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" checked={decision === "approve"} onChange={() => setDecision("approve")} /> Approve
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={decision === "reject"} onChange={() => setDecision("reject")} /> Reject
        </label>
      </div>
      {decision === "approve" && (
        <label className="flex flex-col gap-1 text-sm">
          Approved amount (USD), at most what the family asked for
          <input
            name="approvedUsd"
            type="number"
            required
            min={0.01}
            max={requestedCents / 100}
            step="0.01"
            defaultValue={(requestedCents / 100).toFixed(2)}
            className={`${input} sm:w-48`}
          />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm">
        {decision === "reject" ? "Reason (the family will see it)" : "Note (optional)"}
        <textarea name="note" rows={3} required={decision === "reject"} minLength={decision === "reject" ? 3 : undefined} className={input} />
      </label>
      <ErrorText error={error} />
      <button type="submit" disabled={pending} className={`${button} self-start`}>
        {pending ? "Saving…" : decision === "approve" ? "Approve fund" : "Reject fund"}
      </button>
    </form>
  );
}

export function ReceiptsForm({ fundId }: { fundId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  async function decide(decision: "approve" | "reject") {
    const note = noteRef.current?.value.trim() || undefined;
    if (decision === "reject" && !note) {
      setError("Tell the family which receipts are missing.");
      return;
    }
    setPending(decision);
    setError(null);
    const result = await postJson(`/api/funds/${fundId}/receipts/confirm`, { decision, note });
    setPending(null);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Note (needed when asking for more receipts)
        <textarea ref={noteRef} rows={2} className={input} />
      </label>
      <ErrorText error={error} />
      <div className="flex gap-3">
        <button type="button" disabled={pending !== null} className={button} onClick={() => decide("approve")}>
          {pending === "approve" ? "Closing…" : "Confirm receipts and close fund"}
        </button>
        <button type="button" disabled={pending !== null} className={secondaryButton} onClick={() => decide("reject")}>
          Ask for more receipts
        </button>
      </div>
    </div>
  );
}

/** Starts a PayPal payment and sends the contributor to PayPal to approve it. */
export function ContributeForm({ fundId, remainingCents }: { fundId: string; remainingCents: number }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggested = Math.min(remainingCents, 1000) / 100;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const amountCents = Math.round(Number(new FormData(event.currentTarget).get("amountUsd")) * 100);
        setPending(true);
        setError(null);
        const result = await postJson(`/api/funds/${fundId}/orders`, { amountCents });
        if (result.ok && typeof result.data.approveUrl === "string") {
          window.location.href = result.data.approveUrl;
          return;
        }
        setPending(false);
        setError(result.ok ? "PayPal did not return a payment link." : result.error);
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        Amount (USD)
        <input
          name="amountUsd"
          type="number"
          required
          min={1}
          max={remainingCents / 100}
          step="0.01"
          defaultValue={suggested.toFixed(2)}
          className={`${input} sm:w-48`}
        />
      </label>
      <ErrorText error={error} />
      <button type="submit" disabled={pending} className={`${button} self-start`}>
        {pending ? "Opening PayPal…" : "Contribute with PayPal"}
      </button>
      <p className="text-xs text-muted">Sandbox demo: use a PayPal sandbox buyer account. No real money moves.</p>
    </form>
  );
}

/** On return from PayPal, takes the payment and shows the result. */
export function CaptureOnReturn({ orderId, cancelled }: { orderId: string; cancelled: boolean }) {
  const router = useRouter();
  const started = useRef(false);
  const [state, setState] = useState<{ kind: "working" | "done" | "error"; message: string }>(
    cancelled
      ? { kind: "error", message: "Payment cancelled. Nothing was charged." }
      : { kind: "working", message: "Confirming your payment with PayPal…" },
  );

  useEffect(() => {
    if (cancelled || started.current) return;
    started.current = true;
    postJson(`/api/orders/${orderId}/capture`).then((result) => {
      if (result.ok) {
        setState({ kind: "done", message: "Thank you! Your contribution is in the ledger below." });
      } else {
        setState({ kind: "error", message: result.error });
      }
      // The URL keeps the order id; a reload repeats the capture, which PayPal treats as the same one.
      router.refresh();
    });
  }, [cancelled, orderId, router]);

  const tone = state.kind === "done" ? "border-success text-success" : state.kind === "error" ? "border-danger text-danger" : "border-border text-muted";
  return <p className={`rounded-lg border px-4 py-3 text-sm ${tone}`}>{state.message}</p>;
}
