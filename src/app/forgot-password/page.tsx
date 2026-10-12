import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth-forms";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm text-muted">We will email you a link to choose a new one.</p>
      </div>
      <div className="rounded-3xl border border-border bg-card p-6">
        <ForgotPasswordForm />
      </div>
      <Link href="/login" className="text-sm text-muted hover:text-accent">← Back to sign in</Link>
    </main>
  );
}
