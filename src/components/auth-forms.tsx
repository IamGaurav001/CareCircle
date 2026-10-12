"use client";

import { useActionState } from "react";
import { requestPasswordReset, signIn, signUp, updatePassword, type FormState } from "@/app/auth/actions";

const input = "rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm transition focus:border-accent focus:outline-none";
const button =
  "rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

function Messages({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>;
  if (state.notice) return <p role="status" className="rounded-xl bg-success-soft px-3 py-2 text-sm text-success">{state.notice}</p>;
  return null;
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <input {...props} className={input} />
    </label>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Messages state={state} />
      <Field label="Email" id="email" name="email" type="email" required autoComplete="email" />
      <Field label="Password" id="password" name="password" type="password" required autoComplete="current-password" />
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Messages state={state} />
      <Field label="Your name" name="name" required minLength={2} maxLength={80} autoComplete="name" />
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <Field label="Password (at least 8 characters)" name="password" type="password" required minLength={8} autoComplete="new-password" />
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Creating your account…" : "Create account"}
      </button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Messages state={state} />
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Messages state={state} />
      <Field label="New password (at least 8 characters)" name="password" type="password" required minLength={8} autoComplete="new-password" />
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
