import Link from "next/link";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

async function currentUserOrNull(): Promise<CurrentUser | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null; // Supabase not set up yet: show the signed-out header
  }
}

export async function Header() {
  const user = await currentUserOrNull();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Care<span className="text-accent">Circle</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {user?.role === "family" && (
            <>
              <Link href="/funds">My funds</Link>
              <Link href="/funds/new">New fund</Link>
            </>
          )}
          {user?.role === "reviewer" && <Link href="/review">Review queue</Link>}
          {user ? (
            <>
              <span className="text-muted">
                {user.name} · {user.role}
              </span>
              <form action="/logout" method="post">
                <button type="submit" className="text-muted underline-offset-2 hover:underline">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login">Sign in</Link>
          )}
        </nav>
      </div>
      <p className="bg-warning/10 py-1 text-center text-xs text-warning">
        Sandbox demo: PayPal sandbox money and synthetic bills only.
      </p>
    </header>
  );
}
