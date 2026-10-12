import Link from "next/link";
import { redirect } from "next/navigation";
import { Progress, TrustTrack, VerifiedSeal } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

const STEPS = [
  { who: "Family", title: "Upload the hospital estimate", body: "A photo or PDF of the bill the hospital gave you. That is all you need to start." },
  { who: "AI", title: "Every charge, explained", body: "Gemini lists each charge in plain words and flags totals that do not add up or items it cannot read." },
  { who: "Reviewer", title: "A person verifies the need", body: "A reviewer checks the bill and the flags, then approves an amount. The AI never decides." },
  { who: "Relatives", title: "Pay from anywhere with PayPal", body: "Share one link. Relatives in India or abroad pay with PayPal and see every payment on a public ledger." },
  { who: "PayPal", title: "Money goes only to the hospital", body: "On release, PayPal Payouts sends the money to the approved hospital, never to anyone else and never above the approved amount." },
  { who: "Family", title: "Receipts close the loop", body: "The hospital's receipt is uploaded and checked, and contributors get a final report built from the ledger." },
];

const GUARANTEES = [
  { title: "AI explains, people decide", body: "Flags go to a reviewer. No family is rejected by a model." },
  { title: "Locked to one payee", body: "The hospital's PayPal account is fixed when the fund is approved." },
  { title: "Never paid twice", body: "Every PayPal call carries a request id, so retries cannot move money again." },
  { title: "Numbers from the ledger", body: "Every amount on screen is computed from recorded transactions, not written by AI." },
];

const ROLES = [
  { role: "Families", line: "Turn a confusing bill into a fund relatives trust, without chasing anyone for money." },
  { role: "Relatives", line: "Help from any country, and see exactly where your money went." },
  { role: "Reviewers", line: "Approve needs and releases with the bill, the AI's flags and the code's checks in one place." },
];

export default async function Home() {
  const user = await getCurrentUser().catch(() => null);
  if (user?.role === "family") redirect("/funds");
  if (user?.role === "reviewer") redirect("/review");

  return (
    <main className="flex flex-col">
      <section className="mx-auto grid w-full max-w-5xl gap-10 px-4 pb-16 pt-12 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:pt-20">
        <div className="flex flex-col gap-6">
          <span className="self-start rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted">
            Medical funds people can trust · PayPal + AI
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            A hospital bill, turned into a fund <span className="text-accent">relatives can trust.</span>
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted">
            Families in India pay about two of every five rupees of health costs out of pocket. CareCircle helps them
            raise that money, and shows every relative where it went: AI explains the bill, a reviewer verifies it, and
            PayPal pays only the hospital.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-sm transition hover:brightness-110">
              Try the demo
            </Link>
            <a href="#how" className="rounded-full border border-border bg-card px-6 py-3 font-semibold transition hover:border-accent hover:text-accent">
              See how money moves
            </a>
          </div>
        </div>

        {/* An example of what relatives see: the sample is labelled as one. */}
        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-accent-soft via-transparent to-marigold-soft" aria-hidden />
          <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-xl shadow-black/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Example fund</span>
              <VerifiedSeal approvedCents={96000} />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold">Knee replacement for a father of three</h2>
              <p className="mt-1 text-sm text-muted">Paid only to Sunrise Test Hospital, Pune</p>
            </div>
            <Progress raisedCents={61500} approvedCents={96000} large />
            <TrustTrack status="open" />
            <ul className="flex flex-col gap-1.5 rounded-xl border border-dashed border-border bg-background/60 p-3 font-mono text-xs">
              <li className="flex justify-between"><span className="font-sans">Contribution received</span><span className="text-success">+$250.00</span></li>
              <li className="flex justify-between"><span className="font-sans">Contribution received</span><span className="text-success">+$120.00</span></li>
              <li className="flex justify-between"><span className="font-sans">Contribution received</span><span className="text-success">+$45.00</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-border bg-card/60">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">How the money moves</h2>
            <p className="mt-3 text-muted">
              Six steps, and the fund page shows which one you are on. Nothing moves until a person has approved it.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl font-semibold text-accent/40">{String(i + 1).padStart(2, "0")}</span>
                  <span className="rounded-full bg-marigold-soft px-2.5 py-0.5 text-xs font-semibold text-marigold">{step.who}</span>
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm leading-6 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-16 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Built so money cannot go astray</h2>
          <p className="text-muted">
            Ordinary fundraising pages collect money and stop there. CareCircle ties every payment to a verified bill, a
            single approved hospital and a public record.
          </p>
          <ul className="mt-2 flex flex-col gap-3">
            {ROLES.map((item) => (
              <li key={item.role} className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-marigold" aria-hidden />
                <p className="text-sm leading-6">
                  <span className="font-semibold">{item.role}:</span> <span className="text-muted">{item.line}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          {GUARANTEES.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-5">
              <dt className="flex items-center gap-2 font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-soft text-xs text-success" aria-hidden>✓</span>
                {item.title}
              </dt>
              <dd className="mt-2 text-sm leading-6 text-muted">{item.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-8">
        <div className="flex flex-col items-start gap-4 rounded-3xl bg-accent p-8 text-accent-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">See it work end to end</h2>
            <p className="mt-1 opacity-80">Three demo accounts: a family, a second family and a reviewer. Sandbox money only.</p>
          </div>
          <Link href="/login" className="rounded-full bg-card px-6 py-3 font-semibold text-accent">
            Open the demo
          </Link>
        </div>
      </section>
    </main>
  );
}
