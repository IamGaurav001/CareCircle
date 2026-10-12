import Link from "next/link";
import { Logo } from "@/components/ui";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

async function currentUserOrNull(): Promise<CurrentUser | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null; // Supabase not set up yet: show the signed-out header
  }
}

const navLink = "rounded-full px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-card hover:text-foreground";

export async function Header() {
  const user = await currentUserOrNull();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-xl font-semibold tracking-tight">CareCircle</span>
          <span className="hidden rounded-full bg-marigold-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-marigold sm:inline">
            Sandbox
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          {user?.role === "family" && (
            <>
              <Link href="/funds" className={navLink}>
                My fundraisers
              </Link>
              <Link href="/funds/new" className={navLink}>
                Start a fundraiser
              </Link>
            </>
          )}
          {user?.role === "reviewer" && (
            <Link href="/review" className={navLink}>
              Review queue
            </Link>
          )}
          {user ? (
            <div className="ml-2 flex items-center gap-2 border-l border-border pl-3">
              <span className="hidden text-sm sm:inline">{user.name}</span>
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold capitalize text-accent">{user.role}</span>
              <form action="/logout" method="post">
                <button type="submit" className={navLink}>
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <>
              <Link href="/login" className={navLink}>
                Sign in
              </Link>
              <Link href="/signup" className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
