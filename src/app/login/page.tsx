import Link from "next/link";
import { SignInForm } from "@/components/auth-forms";
import { textLink } from "@/components/styles";
import { AuthCard, Icon, type IconName } from "@/components/ui";

const PATHS: { icon: IconName; title: string; body: string; href: string; cta: string }[] = [
  {
    icon: "file",
    title: "Need help with a hospital bill?",
    body: "Create a free account, upload the bill, and get a link to share with your family.",
    href: "/signup",
    cta: "Start a fundraiser",
  },
  {
    icon: "heart",
    title: "Want to donate?",
    body: "You do not need an account. Open the link the family sent you, or find their fundraiser here.",
    href: "/fundraisers",
    cta: "Browse fundraisers",
  },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 md:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] md:gap-16 md:py-16 lg:gap-24">
      <AuthCard
        title="Welcome back"
        description="Sign in to manage your fundraiser."
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

      <section className="flex max-w-lg flex-col gap-4 md:pt-2">
        <h2 className="text-lg font-semibold">Not sure where to go?</h2>
        {PATHS.map((path) => (
          <Link
            key={path.href}
            href={path.href}
            className="group flex gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-accent/40 hover:shadow-md hover:shadow-black/[0.03]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Icon name={path.icon} />
            </span>
            <span className="flex flex-col gap-1">
              <span className="font-semibold">{path.title}</span>
              <span className="text-sm leading-6 text-muted">{path.body}</span>
              <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                {path.cta} <Icon name="arrowRight" className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
