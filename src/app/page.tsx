import Link from "next/link";
import { redirect } from "next/navigation";
import { Progress, TrustTrack, VerifiedSeal } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

const STEPS = [
  {
    title: "Upload the hospital bill",
    body: "Take a photo of the estimate the hospital gave you. Our AI explains every charge in simple words.",
    icon: "📄",
  },
  {
    title: "We check it is real",
    body: "A CareCircle reviewer looks at the bill and approves how much can be collected.",
    icon: "🔍",
  },
  {
    title: "Family pays from anywhere",
    body: "Share one link on WhatsApp. Relatives in India or abroad pay with PayPal, and everyone sees each payment.",
    icon: "🤝",
  },
  {
    title: "The hospital gets paid",
    body: "We send the money straight to the hospital, then share the hospital's receipt with everyone who helped.",
    icon: "🏥",
  },
];

const FAQ = [
  {
    q: "Does the money come to me?",
    a: "No. It goes straight to the hospital named on the bill. That is why relatives can trust it.",
  },
  {
    q: "Who checks the bill?",
    a: "First the AI reads it and points out anything that looks wrong, such as a total that does not add up. Then a person on the CareCircle team decides. The AI never decides.",
  },
  {
    q: "Do relatives need an account?",
    a: "No. They open the link you share and pay with PayPal, from any country.",
  },
  {
    q: "Can they see where the money went?",
    a: "Yes. Every payment in and the payment to the hospital are listed on the page, with the hospital's receipt at the end.",
  },
  {
    q: "Is this real money?",
    a: "Not yet. This is a hackathon demo on PayPal's test system, with made-up bills. No real money moves.",
  },
];

/** The core idea in one picture: money goes from relatives to the hospital, never to anyone else. */
function MoneyFlow() {
  const node = "flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-4 text-center shadow-sm";
  const arrow = "flex flex-col items-center justify-center gap-1 px-1 text-xs font-semibold text-muted";
  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <div className={`${node} sm:flex-1`}>
        <span className="text-3xl" aria-hidden>👨‍👩‍👧</span>
        <span className="font-semibold">Relatives</span>
        <span className="text-xs text-muted">Anywhere in the world</span>
      </div>
      <div className={arrow}>
        <span className="hidden text-2xl text-accent sm:block" aria-hidden>→</span>
        <span className="text-2xl text-accent sm:hidden" aria-hidden>↓</span>
        <span>pay with PayPal</span>
      </div>
      <div className={`${node} border-accent/40 bg-accent-soft sm:flex-1`}>
        <span className="text-3xl" aria-hidden>🛡️</span>
        <span className="font-semibold">CareCircle</span>
        <span className="text-xs text-muted">Holds it until the bill is checked</span>
      </div>
      <div className={arrow}>
        <span className="hidden text-2xl text-accent sm:block" aria-hidden>→</span>
        <span className="text-2xl text-accent sm:hidden" aria-hidden>↓</span>
        <span>only to</span>
      </div>
      <div className={`${node} sm:flex-1`}>
        <span className="text-3xl" aria-hidden>🏥</span>
        <span className="font-semibold">The hospital</span>
        <span className="text-xs text-muted">Named on the bill</span>
      </div>
    </div>
  );
}

export default async function Home() {
  const user = await getCurrentUser().catch(() => null);
  if (user?.role === "family") redirect("/funds");
  if (user?.role === "reviewer") redirect("/review");

  return (
    <main className="flex flex-col">
      {/* 1. What it is, in one sentence, and who it is for. */}
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-14 pt-12 lg:pt-16">
        <div className="flex max-w-3xl flex-col gap-5">
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Get help paying a <span className="text-accent">hospital bill.</span>
          </h1>
          <p className="text-lg leading-8 text-muted sm:text-xl">
            Share one link with your family. They pay with PayPal from anywhere, and the money goes{" "}
            <span className="font-semibold text-foreground">straight to the hospital</span>, not to anyone else.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/signup"
            className="group flex flex-col gap-2 rounded-3xl bg-accent p-6 text-accent-foreground shadow-lg shadow-accent/20 transition hover:-translate-y-0.5"
          >
            <span className="text-sm font-semibold opacity-80">For families</span>
            <span className="font-display text-2xl font-semibold">I need help with a hospital bill</span>
            <span className="text-sm opacity-90">Upload the bill and get a link to share. Takes about two minutes.</span>
            <span className="mt-2 font-semibold">Start →</span>
          </Link>
          <a
            href="#example"
            className="group flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-accent"
          >
            <span className="text-sm font-semibold text-muted">For relatives and friends</span>
            <span className="font-display text-2xl font-semibold">I want to help someone</span>
            <span className="text-sm text-muted">Open the link your family sent you. No account needed, just PayPal.</span>
            <span className="mt-2 font-semibold text-accent">See what you will see →</span>
          </a>
        </div>
        <p className="-mt-4 text-sm text-muted">
          Checking bills for CareCircle?{" "}
          <Link href="/login" className="font-semibold text-accent underline-offset-2 hover:underline">
            Reviewer sign in
          </Link>
        </p>
      </section>

      {/* 2. The one idea that makes it different. */}
      <section className="border-y border-border bg-card/60">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-14">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight">Where the money goes</h2>
            <p className="mt-2 text-muted">
              On most fundraising pages, money goes to whoever made the page. On CareCircle it can only go to the hospital.
            </p>
          </div>
          <MoneyFlow />
        </div>
      </section>

      {/* 3. How it works, in four plain steps. */}
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-14">
        <h2 className="font-display text-3xl font-semibold tracking-tight">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden>{step.icon}</span>
                <span className="text-sm font-semibold text-muted">Step {i + 1}</span>
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm leading-6 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. What a relative sees when they open the link. */}
      <section id="example" className="border-y border-border bg-card/60">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-3xl font-semibold tracking-tight">What your family sees</h2>
            <p className="text-muted">
              When you share your link, relatives see the hospital, how much is needed, how much has come in, and every
              payment. When the hospital is paid, they see that too.
            </p>
            <ul className="flex flex-col gap-2 text-sm">
              {["The bill was checked by a person", "The money goes only to the named hospital", "Every payment is listed", "The hospital's receipt is shared at the end"].map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-soft text-xs text-success" aria-hidden>✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-xl shadow-black/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Example page</span>
              <VerifiedSeal approvedCents={96000} />
            </div>
            <div>
              <h3 className="font-display text-2xl font-semibold">Knee operation for Papa</h3>
              <p className="mt-1 text-sm text-muted">Money goes only to Sunrise Test Hospital, Pune</p>
            </div>
            <Progress raisedCents={61500} approvedCents={96000} large />
            <TrustTrack status="open" />
            <div className="rounded-xl bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground">Help with PayPal</div>
          </div>
        </div>
      </section>

      {/* 5. The questions people ask first. */}
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-14">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Questions</h2>
        <div className="flex flex-col gap-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-border bg-card p-5 open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {item.q}
                <span className="text-xl text-muted transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-8">
        <div className="flex flex-col items-start gap-4 rounded-3xl bg-accent p-8 text-accent-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">Try it with a sample bill</h2>
            <p className="mt-1 opacity-80">Sign in as a demo family, upload a sample bill, and follow it to the hospital.</p>
          </div>
          <Link href="/login" className="rounded-full bg-card px-6 py-3 font-semibold text-accent">
            Start the demo
          </Link>
        </div>
      </section>
    </main>
  );
}
