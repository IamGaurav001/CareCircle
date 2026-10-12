import Link from "next/link";
import { DemoAccounts } from "@/components/actions";
import { SignInForm } from "@/components/auth-forms";
import { textLink } from "@/components/styles";
import { AuthCard } from "@/components/ui";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-12 md:grid-cols-[1fr_0.9fr] md:py-16">
      <AuthCard
        title="Sign in"
        description="For families running a fundraiser, and for CareCircle reviewers."
        footer={
          <>
            New to CareCircle?{" "}
            <Link href="/signup" className={textLink}>
              Create an account
            </Link>
          </>
        }
      >
        {error === "link" && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
            That link has expired or has already been used. Sign in, or ask for a new link.
          </p>
        )}
        <SignInForm />
        <Link href="/forgot-password" className="self-start text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
          Forgot your password?
        </Link>
      </AuthCard>

      <section className="flex flex-col gap-4 md:pt-2">
        <div>
          <h2 className="text-lg font-semibold">Trying the demo?</h2>
          <p className="mt-1 text-sm text-muted">
            Pick a demo account to fill in its email. The password is the <code className="rounded bg-subtle px-1">DEMO_PASSWORD</code> value
            in <code className="rounded bg-subtle px-1">.env.local</code>.
          </p>
        </div>
        <DemoAccounts />
        <p className="text-sm text-muted">
          Relatives who want to pay do not need to sign in. They use the link the family shares with them.
        </p>
      </section>
    </main>
  );
}
