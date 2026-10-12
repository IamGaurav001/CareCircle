import { redirect } from "next/navigation";
import { DemoAccounts } from "@/components/actions";
import { createClient } from "@/lib/supabase/server";

async function signIn(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  redirect(error ? "/login?error=1" : "/");
}

const input = "rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm transition focus:border-accent focus:outline-none";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-12 lg:grid-cols-2 lg:py-20">
      <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted">Pick a demo account on the right, or type your own.</p>
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
            Wrong email or password.
          </p>
        )}
        <form action={signIn} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Email
            <input id="email" name="email" type="email" required autoComplete="email" className={input} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Password
            <input id="password" name="password" type="password" required autoComplete="current-password" className={input} />
          </label>
          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition hover:brightness-110"
          >
            Sign in
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-semibold">Demo accounts</h2>
        <p className="text-sm text-muted">
          Each account plays one part of the story. The password is <code className="rounded bg-card px-1">DEMO_PASSWORD</code>{" "}
          in your <code className="rounded bg-card px-1">.env.local</code>.
        </p>
        <DemoAccounts />
        <p className="text-sm text-muted">
          Relatives do not need an account: they pay from a fund&apos;s public page with a PayPal sandbox buyer.
        </p>
      </div>
    </main>
  );
}
