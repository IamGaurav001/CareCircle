import Link from "next/link";
import { primaryButton } from "@/components/styles";
import { Logo } from "@/components/ui";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

async function currentUserOrNull(): Promise<CurrentUser | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null; // Supabase not set up yet: show the signed-out header
  }
}

const navLink = "rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-subtle hover:text-foreground";

const ROLE_LABEL: Record<CurrentUser["role"], string> = {
  family: "Family account",
  reviewer: "Reviewer",
  contributor: "Supporter",
};

export async function Header() {
  const user = await currentUserOrNull();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">CareCircle</span>
          <span className="rounded-md bg-warning-soft px-1.5 py-0.5 text-[11px] font-semibold text-warning">Demo</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1" aria-label="Main">
          {user?.role === "family" && (
            <>
              <Link href="/funds" className={navLink}>
                My fundraisers
              </Link>
              <Link href="/funds/new" className={navLink}>
                New fundraiser
              </Link>
            </>
          )}
          {user?.role === "reviewer" && (
            <Link href="/review" className={navLink}>
              Review queue
            </Link>
          )}
          {user ? (
            <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
              <span className="hidden flex-col text-right leading-tight sm:flex">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted">{ROLE_LABEL[user.role]}</span>
              </span>
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
              <Link href="/signup" className={`${primaryButton} ml-1 py-2`}>
                Start a fundraiser
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
