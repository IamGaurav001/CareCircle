"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { dangerButton, inputField, primaryButton, secondaryButton } from "@/components/styles";

// Buttons and forms that call the API routes. The routes hold every rule; these only
// send the request and show the route's answer.

type Result = { ok: true; data: Record<string, unknown> } | { ok: false; error: string };

async function send(url: string, init: RequestInit): Promise<Result> {
  try {
    const res = await fetch(url, init);
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) return { ok: true, data };
    return { ok: false, error: typeof data.error === "string" ? data.error : `Something went wrong (error ${res.status}). Please try again.` };
  } catch {
    return { ok: false, error: "Could not reach CareCircle. Check your internet connection and try again." };
  }
}

function postJson(url: string, body: unknown = {}) {
  return send(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
      {error}
    </p>
  ) : null;
}

function Spinner() {
  return <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />;
}

/** A labelled form field with an optional line of help below it. */
function Field({ label, optional, hint, children }: { label: string; optional?: boolean; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

/** A button that posts to a route and refreshes the page on success. */
export function ActionButton({
  url,
  body,
  label,
  pendingLabel,
  secondary,
  confirm,
}: {
  url: string;
  body?: unknown;
  label: string;
  pendingLabel?: string;
  secondary?: boolean;
  /** Asked before anything is sent, for actions that cannot be undone. */
  confirm?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        className={`${secondary ? secondaryButton : primaryButton} self-start`}
        onClick={async () => {
          if (confirm && !window.confirm(confirm)) return;
          setPending(true);
          setError(null);
          const result = await postJson(url, body);
          setPending(false);
          if (result.ok) router.refresh();
          else setError(result.error);
        }}
      >
        {pending && <Spinner />}
        {pending ? (pendingLabel ?? "Working…") : label}
      </button>
      <ErrorText error={error} />
    </div>
  );
}

type FundFields = {
  title: string;
  purpose: string;
  payeeName: string;
  payeePaypalEmail: string;
  requestedCents: number;
};

/** Creates a fundraiser, or edits a draft when `fundId` is given. */
function FundForm({ fundId, initial, onDone }: { fundId?: string; initial?: FundFields; onDone?: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const body = {
          title: form.get("title"),
          purpose: form.get("purpose"),
          payeeName: form.get("payeeName"),
          payeePaypalEmail: form.get("payeePaypalEmail"),
          requestedCents: Math.round(Number(form.get("requestedUsd")) * 100),
        };
        setPending(true);
        setError(null);
        const result = fundId
          ? await send(`/api/funds/${fundId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
          : await postJson("/api/funds", body);
        setPending(false);
        if (!result.ok) return setError(result.error);
        if (fundId) {
          router.refresh();
          onDone?.();
        } else {
          router.push(`/funds/${result.data.id}`);
        }
      }}
    >
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-sm font-semibold text-muted">About the treatment</legend>
        <Field label="Fundraiser title" hint="A short name your relatives will recognise.">
          <input name="title" required minLength={3} maxLength={120} defaultValue={initial?.title} placeholder="Knee surgery for Papa" className={inputField} />
        </Field>
        <Field label="Tell your relatives what happened" hint="Who is in hospital, what the treatment is, and why you need help. Relatives will read this.">
          <textarea
            name="purpose"
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            defaultValue={initial?.purpose}
            placeholder="Papa needs knee replacement surgery next month. Insurance covers part of it, and we need help with the rest."
            className={inputField}
          />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-border pt-5">
        <legend className="mb-3 text-sm font-semibold text-muted">Who gets paid</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hospital or clinic name" hint="The money is paid to them, never to you.">
            <input name="payeeName" required minLength={2} maxLength={120} defaultValue={initial?.payeeName} placeholder="Sunrise Hospital, Pune" className={inputField} />
          </Field>
          <Field label="Hospital's PayPal email" hint="Ask the hospital's billing desk. It cannot be changed after approval.">
            <input name="payeePaypalEmail" type="email" required defaultValue={initial?.payeePaypalEmail} placeholder="billing@hospital.example" className={inputField} />
          </Field>
        </div>
        <Field label="Amount you need, in US dollars" hint="Relatives pay through PayPal in US dollars. The reviewer may approve less than you ask for.">
          <div className="relative sm:w-56">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
            <input
              name="requestedUsd"
              type="number"
              required
              min={1}
              max={100000}
              step="0.01"
              defaultValue={initial ? (initial.requestedCents / 100).toFixed(2) : undefined}
              className={`${inputField} pl-7`}
            />
          </div>
        </Field>
      </fieldset>

      <ErrorText error={error} />
      <div className="flex flex-wrap gap-3 border-t border-border pt-5">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending && <Spinner />}
          {pending ? "Saving…" : fundId ? "Save changes" : "Save and continue"}
        </button>
        {fundId && (
          <button type="button" className={secondaryButton} onClick={onDone}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function NewFundForm() {
  return <FundForm />;
}

/** On a draft: edit its details, or delete it. */
export function DraftControls({ fundId, initial }: { fundId: string; initial: FundFields }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (editing) return <FundForm fundId={fundId} initial={initial} onDone={() => setEditing(false)} />;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={secondaryButton} onClick={() => setEditing(true)}>
          Edit details
        </button>
        <button
          type="button"
          disabled={deleting}
          className={dangerButton}
          onClick={async () => {
            if (!window.confirm("Delete this draft and the bill you uploaded? This cannot be undone.")) return;
            setDeleting(true);
            const result = await send(`/api/funds/${fundId}`, { method: "DELETE" });
            if (result.ok) {
              router.push("/funds");
              router.refresh();
            } else {
              setDeleting(false);
              setError(result.error);
            }
          }}
        >
          {deleting ? "Deleting…" : "Delete draft"}
        </button>
      </div>
      <ErrorText error={error} />
    </div>
  );
}

/** Uploads a bill or receipt to the route that stores it and has the AI read it. */
export function UploadForm({ url, label, what }: { url: string; label: string; what: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setPending(true);
        setError(null);
        const result = await send(url, { method: "POST", body: new FormData(form) });
        setPending(false);
        if (result.ok) {
          form.reset();
          setFileName(null);
          router.refresh();
        } else setError(result.error);
      }}
    >
      <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-border bg-subtle/50 px-4 py-6 text-center transition hover:border-accent/50">
        <span className="text-sm font-semibold">{fileName ?? `Choose the ${what}`}</span>
        <span className="text-xs text-muted">{fileName ? "Click to choose a different file" : "PDF or photo (JPG, PNG, HEIC), up to 4 MB"}</span>
        <input
          name="file"
          type="file"
          required
          accept="application/pdf,image/*"
          className="sr-only"
          onChange={(event) => setFileName(event.currentTarget.files?.[0]?.name ?? null)}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || !fileName} className={primaryButton}>
          {pending && <Spinner />}
          {pending ? "Uploading and reading…" : label}
        </button>
        {pending && <span className="text-sm text-muted">The AI is reading the file. This can take up to a minute.</span>}
      </div>
      <p className="text-xs text-muted">Your documents stay private. Only you, the AI that reads them and our review team can open them.</p>
      <ErrorText error={error} />
    </form>
  );
}

const rejectButton = primaryButton.replace("bg-accent", "bg-danger").replace("hover:bg-accent-hover", "hover:opacity-90");

export function ReviewForm({ fundId, requestedCents }: { fundId: string; requestedCents: number }) {
  const router = useRouter();
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const choice = (value: "approve" | "reject", label: string) => (
    <button
      type="button"
      aria-pressed={decision === value}
      onClick={() => setDecision(value)}
      className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
        decision === value ? (value === "approve" ? "bg-card text-success shadow-sm" : "bg-card text-danger shadow-sm") : "text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

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
      <div className="flex gap-1 rounded-lg bg-subtle p-1 sm:w-80">
        {choice("approve", "Approve")}
        {choice("reject", "Reject")}
      </div>
      {decision === "approve" && (
        <Field label="Amount to approve, in US dollars" hint={`Up to the $${(requestedCents / 100).toFixed(2)} the family asked for.`}>
          <div className="relative sm:w-56">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
            <input
              name="approvedUsd"
              type="number"
              required
              min={0.01}
              max={requestedCents / 100}
              step="0.01"
              defaultValue={(requestedCents / 100).toFixed(2)}
              className={`${inputField} pl-7`}
            />
          </div>
        </Field>
      )}
      <Field
        label={decision === "reject" ? "Reason for rejecting" : "Note for the family"}
        optional={decision === "approve"}
        hint="The family will see this."
      >
        <textarea name="note" rows={3} required={decision === "reject"} minLength={decision === "reject" ? 3 : undefined} className={inputField} />
      </Field>
      <ErrorText error={error} />
      <button type="submit" disabled={pending} className={`${decision === "approve" ? primaryButton : rejectButton} self-start`}>
        {pending && <Spinner />}
        {pending ? "Saving…" : decision === "approve" ? "Approve and open for payments" : "Reject this bill"}
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
      setError("Tell the family what is missing, so they know what to upload.");
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
    <div className="flex flex-col gap-4">
      <Field label="Note for the family" hint="Required if you ask for more receipts. The family will see it.">
        <textarea ref={noteRef} rows={2} className={inputField} />
      </Field>
      <ErrorText error={error} />
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={pending !== null} className={primaryButton} onClick={() => decide("approve")}>
          {pending === "approve" ? "Completing…" : "Accept receipt and complete"}
        </button>
        <button type="button" disabled={pending !== null} className={secondaryButton} onClick={() => decide("reject")}>
          {pending === "reject" ? "Sending…" : "Ask for more receipts"}
        </button>
      </div>
    </div>
  );
}

/** Reviewer: cancels a fundraiser that is taking payments, and refunds everyone who paid. */
export function CancelForm({ fundId, payments }: { fundId: string; payments: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" className={`${dangerButton} self-start px-0 hover:bg-transparent hover:underline`} onClick={() => setOpen(true)}>
        Cancel this fundraiser and refund everyone
      </button>
    );
  }
  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-danger/30 bg-danger-soft p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const note = String(new FormData(event.currentTarget).get("note") ?? "").trim();
        setPending(true);
        setError(null);
        const result = await postJson(`/api/funds/${fundId}/cancel`, { note });
        setPending(false);
        if (!result.ok) return setError(result.error);
        if (Number(result.data.failed) > 0) setError(`${result.data.failed} refund(s) did not go through. Use "Retry refunds" on this page.`);
        router.refresh();
      }}
    >
      <div className="text-sm leading-6">
        <p className="font-semibold">Cancel and refund</p>
        <p>
          {payments === 0
            ? "The fundraiser stops taking payments. No one has paid yet, so there is nothing to refund."
            : `The fundraiser stops taking payments, and ${payments === 1 ? "the 1 payment so far goes" : `all ${payments} payments so far go`} back in full to the people who made them, through PayPal.`}{" "}
          This cannot be undone.
        </p>
      </div>
      <Field label="Reason for cancelling" hint="Everyone who donated will see it.">
        <textarea name="note" rows={2} required minLength={3} className={inputField} />
      </Field>
      <ErrorText error={error} />
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={rejectButton}>
          {pending && <Spinner />}
          {pending ? "Cancelling and refunding…" : "Cancel and refund everyone"}
        </button>
        <button type="button" disabled={pending} className={secondaryButton} onClick={() => setOpen(false)}>
          Keep it open
        </button>
      </div>
    </form>
  );
}

const QUICK_AMOUNTS = [10, 25, 50, 100];

type PaypalButtonsInstance = { render: (container: HTMLElement) => Promise<void>; close: () => Promise<void> };
type PaypalSdk = { Buttons: (options: Record<string, unknown>) => PaypalButtonsInstance };

let paypalSdk: Promise<PaypalSdk> | null = null;

/** Loads PayPal's checkout script once per page. The client id is public by design. */
function loadPaypalSdk(clientId: string): Promise<PaypalSdk> {
  paypalSdk ??= new Promise<PaypalSdk>((resolve, reject) => {
    const script = document.createElement("script");
    const query = new URLSearchParams({
      "client-id": clientId,
      currency: "USD",
      intent: "capture",
      components: "buttons",
      "enable-funding": "venmo,card",
      "disable-funding": "paylater",
    });
    script.src = `https://www.paypal.com/sdk/js?${query}`;
    script.onload = () => {
      const sdk = (window as unknown as { paypal?: PaypalSdk }).paypal;
      if (sdk) resolve(sdk);
      else reject(new Error("PayPal script loaded without its API"));
    };
    script.onerror = () => {
      paypalSdk = null; // let a later visit try again
      reject(new Error("PayPal script did not load"));
    };
    document.head.appendChild(script);
  });
  return paypalSdk;
}

/**
 * Takes a contribution. PayPal's buttons let people pay with a PayPal account, a debit or
 * credit card without an account, or Venmo in the US. If PayPal's script cannot load, the
 * form falls back to sending them to PayPal's site.
 */
export function ContributeForm({ fundId, remainingCents, paypalClientId }: { fundId: string; remainingCents: number; paypalClientId: string | null }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkFailed, setSdkFailed] = useState(!paypalClientId);
  const [paid, setPaid] = useState(false);
  const remaining = remainingCents / 100;
  const quick = QUICK_AMOUNTS.filter((amount) => amount <= remaining);
  const [amount, setAmount] = useState((quick[1] ?? quick[0] ?? remaining).toFixed(2));

  // What the form says now, read when a button is pressed.
  function fields() {
    const form = new FormData(formRef.current ?? undefined);
    return {
      amountCents: Math.round(Number(form.get("amountUsd")) * 100),
      contributorName: String(form.get("contributorName") ?? ""),
      message: String(form.get("message") ?? ""),
    };
  }

  function problem(amountCents: number): string | null {
    if (!Number.isFinite(amountCents) || amountCents < 100) return "Enter an amount of at least $1.";
    if (amountCents > remainingCents) return `Only $${remaining.toFixed(2)} is still needed. Please enter a smaller amount.`;
    return null;
  }

  useEffect(() => {
    if (!paypalClientId) return;
    let closed = false;
    let buttons: PaypalButtonsInstance | null = null;
    loadPaypalSdk(paypalClientId).then(
      (sdk) => {
        if (closed || !buttonsRef.current) return;
        buttons = sdk.Buttons({
          style: { layout: "vertical", shape: "rect", label: "pay", height: 44 },
          onClick: (_data: unknown, actions: { resolve: () => void; reject: () => void }) => {
            const found = problem(fields().amountCents);
            setError(found);
            return found ? actions.reject() : actions.resolve();
          },
          createOrder: async (data: { paymentSource?: string }) => {
            const source = ["paypal", "venmo", "card"].includes(data.paymentSource ?? "") ? data.paymentSource : "paypal";
            const result = await postJson(`/api/funds/${fundId}/orders`, { ...fields(), paymentSource: source });
            if (!result.ok) {
              setError(result.error);
              throw new Error(result.error);
            }
            return String(result.data.id);
          },
          onApprove: async (data: { orderID: string }) => {
            setPending(true);
            const result = await postJson(`/api/orders/${data.orderID}/capture`);
            setPending(false);
            if (!result.ok) return setError(result.error);
            setPaid(true);
            router.refresh();
          },
          onCancel: () => setError("You closed PayPal before paying. Nothing was charged."),
          onError: () => setError((current) => current ?? "PayPal could not take the payment. Please try again."),
        });
        buttons.render(buttonsRef.current).catch(() => setSdkFailed(true));
      },
      () => setSdkFailed(true),
    );
    return () => {
      closed = true;
      buttons?.close().catch(() => {});
    };
    // fields() and problem() read the form when called, so they need no re-render here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paypalClientId, fundId, remainingCents]);

  if (paid) {
    return (
      <div role="status" className="flex flex-col gap-1 rounded-xl border border-success/30 bg-success-soft p-4 text-sm">
        <p className="font-semibold">Thank you for your kindness!</p>
        <p className="text-foreground/80">Your donation went through, and it is on its way to helping pay the bill. You can see it in the list of donations.</p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-4"
      onSubmit={async (event) => {
        // Only used when PayPal's buttons could not load: send the contributor to PayPal's site.
        event.preventDefault();
        const values = fields();
        const found = problem(values.amountCents);
        if (found) return setError(found);
        setPending(true);
        setError(null);
        const result = await postJson(`/api/funds/${fundId}/orders`, values);
        if (result.ok && typeof result.data.approveUrl === "string") {
          window.location.href = result.data.approveUrl;
          return;
        }
        setPending(false);
        setError(result.ok ? "PayPal did not send back a payment link. Please try again." : result.error);
      }}
    >
      <Field label="How much would you like to give?" hint={`In US dollars. Up to $${remaining.toFixed(2)} is still needed.`}>
        <div className="flex flex-col gap-2">
          {quick.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {quick.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(value.toFixed(2))}
                  className={`rounded-lg border py-2 text-sm font-semibold transition ${
                    Number(amount) === value ? "border-accent bg-accent-soft text-accent" : "border-border hover:bg-subtle"
                  }`}
                >
                  ${value}
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
            <input
              name="amountUsd"
              type="number"
              required
              min={1}
              max={remaining}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-label="Amount in US dollars"
              className={`${inputField} pl-7`}
            />
          </div>
        </div>
      </Field>
      <Field label="Your name" optional hint="Leave it empty to appear as Anonymous.">
        <input name="contributorName" maxLength={60} placeholder="Priya, his niece" className={inputField} />
      </Field>
      <Field label="Message for the family" optional>
        <textarea name="message" maxLength={280} rows={2} placeholder="Get well soon!" className={inputField} />
      </Field>
      <ErrorText error={error} />
      {pending && (
        <p role="status" className="flex items-center gap-2 text-sm text-muted">
          <Spinner /> Confirming your payment with PayPal…
        </p>
      )}
      {sdkFailed ? (
        <button type="submit" disabled={pending} className={`${primaryButton} py-3`}>
          {pending ? "Opening PayPal…" : "Continue to PayPal"}
        </button>
      ) : (
        <div ref={buttonsRef} className="min-h-[96px]" aria-label="Payment options" />
      )}
      <p className="text-xs leading-5 text-muted">
        Payments are handled securely by PayPal. You can pay with a debit or credit card without a PayPal account, and
        with Venmo in the US. Your donation goes only to the hospital.
      </p>
    </form>
  );
}

/** On return from PayPal, takes the payment and shows the result. */
export function CaptureOnReturn({ orderId, cancelled }: { orderId: string; cancelled: boolean }) {
  const router = useRouter();
  const started = useRef(false);
  const [state, setState] = useState<{ kind: "working" | "done" | "error"; title: string; message: string }>(
    cancelled
      ? { kind: "error", title: "Payment cancelled", message: "You left PayPal before paying. Nothing was charged." }
      : { kind: "working", title: "Confirming your payment", message: "Please wait while PayPal confirms it…" },
  );

  useEffect(() => {
    if (cancelled || started.current) return;
    started.current = true;
    postJson(`/api/orders/${orderId}/capture`).then((result) => {
      if (result.ok) {
        setState({ kind: "done", title: "Thank you for your kindness!", message: "Your donation went through, and it is on its way to helping pay the bill. You can see it in the list below." });
      } else {
        setState({ kind: "error", title: "The payment did not go through", message: result.error });
      }
      // The URL keeps the order id; a reload repeats the capture, which PayPal treats as the same one.
      router.refresh();
    });
  }, [cancelled, orderId, router]);

  const tone =
    state.kind === "done" ? "border-success/30 bg-success-soft" : state.kind === "error" ? "border-danger/30 bg-danger-soft" : "border-border bg-card";
  return (
    <div role="status" className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${tone}`}>
      {state.kind === "working" && <span className="mt-1"><Spinner /></span>}
      <div>
        <p className="font-semibold">{state.title}</p>
        <p className="text-foreground/80">{state.message}</p>
      </div>
    </div>
  );
}

/** Copies the public fundraiser link, or opens WhatsApp with it, for families to share. */
export function ShareLink({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = () => `${window.location.origin}${path}`;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={secondaryButton}
        onClick={async () => {
          await navigator.clipboard.writeText(fullUrl());
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
      <button
        type="button"
        className={primaryButton}
        onClick={() => {
          const text = `Please help with "${title}". The money goes directly to the hospital: ${fullUrl()}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
        }}
      >
        Share on WhatsApp
      </button>
    </div>
  );
}

/** Has the AI draft the message a family sends with their link, in English and Hindi, ready to edit and send. */
export function ShareMessageWriter({ fundId }: { fundId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ english: string; hindi: string } | null>(null);
  const [language, setLanguage] = useState<"english" | "hindi">("english");
  const [copied, setCopied] = useState(false);

  async function write() {
    setPending(true);
    setError(null);
    const result = await postJson(`/api/funds/${fundId}/share-message`);
    setPending(false);
    if (!result.ok) return setError(result.error);
    setMessages({ english: String(result.data.english), hindi: String(result.data.hindi) });
  }

  if (!messages) {
    return (
      <div className="flex flex-col gap-2">
        <button type="button" disabled={pending} onClick={write} className={`${secondaryButton} self-start`}>
          {pending && <Spinner />}
          {pending ? "Writing your message…" : "Write a message for me (English and Hindi)"}
        </button>
        <ErrorText error={error} />
      </div>
    );
  }

  const text = messages[language];
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Your message, written by AI</p>
        <div className="flex gap-1 rounded-lg bg-subtle p-1">
          {(["english", "hindi"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={language === value}
              onClick={() => setLanguage(value)}
              className={`rounded-md px-3 py-1 text-sm font-semibold transition ${language === value ? "bg-card shadow-sm" : "text-muted hover:text-foreground"}`}
            >
              {value === "english" ? "English" : "हिन्दी"}
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={text}
        onChange={(event) => setMessages({ ...messages, [language]: event.target.value })}
        rows={7}
        aria-label="Message to send"
        className={inputField}
      />
      <p className="text-xs text-muted">Read it and change anything you like before sending.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={secondaryButton}
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Message copied" : "Copy message"}
        </button>
        <button
          type="button"
          className={primaryButton}
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer")}
        >
          Send on WhatsApp
        </button>
        <button type="button" disabled={pending} className={`${secondaryButton} border-transparent`} onClick={write}>
          {pending ? "Writing…" : "Write a new one"}
        </button>
      </div>
      <ErrorText error={error} />
    </div>
  );
}

/**
 * While PayPal is sending money to the hospital, asks PayPal for the latest status every few
 * seconds and refreshes the page when it changes, so nobody has to press a button.
 */
export function PayoutWatcher({ fundId }: { fundId: string }) {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      const result = await postJson(`/api/funds/${fundId}/release/sync`);
      if (result.ok && result.data.fundStatus !== "releasing") {
        clearInterval(timer);
        router.refresh();
      } else if (tries >= 24) {
        clearInterval(timer);
        setGaveUp(true);
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [fundId, router]);

  return gaveUp ? (
    <ActionButton url={`/api/funds/${fundId}/release/sync`} label="Check again with PayPal" pendingLabel="Asking PayPal…" secondary />
  ) : (
    <p role="status" className="flex items-center gap-2 text-sm text-muted">
      <Spinner /> Waiting for PayPal to confirm. This page updates by itself.
    </p>
  );
}

/**
 * Scrolls to the section named in the address (/#how-it-works) once the page is here.
 * Next.js does not do this when the link comes from another page: the home page is still
 * streaming in, and the router scrolls to the top after it. So this tries for a moment
 * until the section is in place.
 */
export function ScrollToHash() {
  useEffect(() => {
    let tries = 0;
    const timer = setInterval(() => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const section = id ? document.getElementById(id) : null;
      if (section) {
        section.scrollIntoView({ behavior: "instant" });
        if (Math.abs(section.getBoundingClientRect().top) < 200) clearInterval(timer);
      }
      if (++tries >= 15) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, []);
  return null;
}

/**
 * A link to a section of the home page. On the home page it scrolls there itself: the router
 * does nothing when the address already ends in that section, and overshoots otherwise.
 * From any other page it is a normal link, and ScrollToHash finishes the job.
 */
export function SectionLink({ section, className, children }: { section: string; className?: string; children: React.ReactNode }) {
  return (
    <Link
      href={`/#${section}`}
      className={className}
      onClick={(event) => {
        const target = window.location.pathname === "/" ? document.getElementById(section) : null;
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView();
      }}
    >
      {children}
    </Link>
  );
}
