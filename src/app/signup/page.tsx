import Link from "next/link";
import { SignUpForm } from "@/components/auth-forms";

const PROMISES = [
  "CareCircle charges nothing. PayPal's usual fees apply to payments.",
  "Your bill is seen only by you, the CareCircle reviewer and the AI that reads it.",
  "Money from your family goes straight to the hospital.",
];

export default function SignUpPage() {
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-12 lg:grid-cols-2 lg:py-20">
      <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted">
            Already have one?{" "}
            <Link href="/login" className="font-semibold text-accent underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
        <SignUpForm />
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-semibold">Then, in about two minutes</h2>
        <ol className="flex flex-col gap-3 text-sm">
          <li><span className="font-semibold">1.</span> Upload the hospital bill. The AI explains every charge.</li>
          <li><span className="font-semibold">2.</span> We check the bill and approve an amount.</li>
          <li><span className="font-semibold">3.</span> You get a link to share with family on WhatsApp.</li>
        </ol>
        <ul className="mt-2 flex flex-col gap-2">
          {PROMISES.map((promise) => (
            <li key={promise} className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-soft text-xs text-success" aria-hidden>✓</span>
              {promise}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
