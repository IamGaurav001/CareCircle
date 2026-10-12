"use client";

import { useActionState } from "react";
import { requestPasswordReset, signIn, signUp, updatePassword, type FormState } from "@/app/auth/actions";
import { inputField, primaryButton } from "@/components/styles";

function Messages({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">{state.error}</p>;
  if (state.notice) return <p role="status" className="rounded-lg bg-success-soft px-3 py-2.5 text-sm text-success">{state.notice}</p>;
  return null;
}

function Field({ label, hint, ...props }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <input {...props} className={inputField} />
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
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
      <button type="submit" disabled={pending} className={primaryButton}>
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
      <Field label="Your full name" name="name" required minLength={2} maxLength={80} autoComplete="name" hint="Relatives will see this name on your fundraiser." />
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <Field label="Password" name="password" type="password" required minLength={8} autoComplete="new-password" hint="At least 8 characters." />
      <button type="submit" disabled={pending} className={primaryButton}>
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
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Sending…" : "Email me a reset link"}
      </button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Messages state={state} />
      <Field label="New password" name="password" type="password" required minLength={8} autoComplete="new-password" hint="At least 8 characters." />
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
