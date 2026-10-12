import Link from "next/link";
import { SignUpForm } from "@/components/auth-forms";
import { textLink } from "@/components/styles";
import { AuthCard, Icon } from "@/components/ui";

const NEXT = [
  "Upload the hospital bill. AI explains every charge in simple words.",
  "A CareCircle reviewer checks the bill and approves an amount.",
  "You get one link to share with family on WhatsApp.",
];

const PROMISES = [
  "CareCircle is free. PayPal's usual fees apply to payments.",
  "Only you, the reviewer and the AI that reads it can see your bill.",
  "Money from your family is paid directly to the hospital.",
];

export default function SignUpPage() {
  return (
    <main className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-12 md:grid-cols-[1fr_0.9fr] md:py-16">
      <AuthCard
        title="Create your account"
        description="You need an account to start a fundraiser. Relatives who pay do not."
        footer={
          <>
            Already have an account?{" "}
            <Link href="/login" className={textLink}>
              Sign in
            </Link>
          </>
        }
      >
        <SignUpForm />
      </AuthCard>

      <section className="flex flex-col gap-6 md:pt-2">
        <div>
          <h2 className="text-lg font-semibold">What happens next</h2>
          <ol className="mt-3 flex flex-col gap-3">
            {NEXT.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                  {i + 1}
                </span>
                <span className="leading-6">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <ul className="flex flex-col gap-2.5 border-t border-border pt-6">
          {PROMISES.map((promise) => (
            <li key={promise} className="flex gap-2.5 text-sm text-muted">
              <span className="mt-0.5 shrink-0 text-success">
                <Icon name="check" className="h-4 w-4" />
              </span>
              {promise}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
