import Link from "next/link";
import { DemoAccounts } from "@/components/actions";
import { SignInForm } from "@/components/auth-forms";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-12 lg:grid-cols-2 lg:py-20">
      <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-accent underline-offset-2 hover:underline">
              Create a free account
            </Link>
          </p>
        </div>
        {error === "link" && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
            That link has expired or was already used. Sign in, or ask for a new link.
          </p>
        )}
        <SignInForm />
        <Link href="/forgot-password" className="text-sm text-muted underline-offset-2 hover:text-accent hover:underline">
          Forgot your password?
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-semibold">Just trying it out?</h2>
        <p className="text-sm text-muted">
          Use a demo account. Each one plays one part of the story. The password is{" "}
          <code className="rounded bg-card px-1">DEMO_PASSWORD</code> in <code className="rounded bg-card px-1">.env.local</code>.
        </p>
        <DemoAccounts />
        <p className="text-sm text-muted">
          Relatives never need an account: they pay from the link the family shares.
        </p>
      </div>
    </main>
  );
}
