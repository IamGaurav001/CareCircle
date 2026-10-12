import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser().catch(() => null);
  if (user?.role === "family") redirect("/funds");
  if (user?.role === "reviewer") redirect("/review");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold leading-tight">
          A medical bill, turned into a fund people can trust.
        </h1>
        <p className="text-lg text-muted">
          A family uploads a hospital estimate, AI explains it in plain language, and a reviewer approves the fund.
          Relatives pay through PayPal, and the money goes only to the approved hospital, with every rupee on a
          public ledger.
        </p>
      </div>
      <ol className="grid gap-3 text-sm sm:grid-cols-4">
        {["Upload the estimate", "AI explains it", "A reviewer approves", "Relatives pay; the hospital is paid"].map(
          (step, i) => (
            <li key={step} className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs font-medium text-accent">Step {i + 1}</div>
              <div className="mt-1 font-medium">{step}</div>
            </li>
          ),
        )}
      </ol>
      <Link href="/login" className="self-start rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-foreground">
        Sign in to try the demo
      </Link>
    </main>
  );
}
