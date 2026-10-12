import Link from "next/link";
import { redirect } from "next/navigation";
import { primaryButton, secondaryButton } from "@/components/styles";
import { Icon, type IconName, Progress, TrustTrack, VerifiedSeal } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

const PROMISES: { icon: IconName; title: string; body: string }[] = [
  { icon: "shield", title: "Every bill is checked", body: "A person reviews the hospital bill before anyone can pay." },
  { icon: "hospital", title: "Paid only to the hospital", body: "The money never goes to the family or anyone else." },
  { icon: "eye", title: "Every payment is visible", body: "Everyone who helps can see where each dollar went." },
];

const AUDIENCES: { icon: IconName; who: string; title: string; body: string; link: { href: string; label: string } }[] = [
  {
    icon: "file",
    who: "For families",
    title: "You have a hospital bill to pay",
    body: "Upload the bill, wait for it to be approved, and share one link with your relatives.",
    link: { href: "/signup", label: "Start a fundraiser" },
  },
  {
    icon: "heart",
    who: "For relatives and friends",
    title: "Someone sent you a link",
    body: "Open it, check the bill was approved, and pay with PayPal. You do not need an account.",
    link: { href: "#example", label: "See what you will see" },
  },
  {
    icon: "shield",
    who: "For reviewers",
    title: "You check bills for CareCircle",
    body: "Approve or reject each bill, then send the money to the hospital when it is collected.",
    link: { href: "/login", label: "Reviewer sign in" },
  },
];

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "upload",
    title: "Upload the hospital bill",
    body: "Add a photo or PDF of the estimate. AI explains every charge in simple words, points out anything that looks wrong, and suggests questions to ask the hospital.",
  },
  {
    icon: "shield",
    title: "A reviewer approves it",
    body: "A CareCircle reviewer checks the bill and approves the amount that can be collected.",
  },
  {
    icon: "users",
    title: "Family and friends pay",
    body: "Share one link on WhatsApp, with a message AI writes for you in English or Hindi. Relatives in India or abroad pay with PayPal or a card.",
  },
  {
    icon: "hospital",
    title: "The hospital is paid",
    body: "The reviewer sends the money directly to the hospital. The family then shares the hospital's receipt with everyone.",
  },
];

const FAQ = [
  {
    q: "Does the money come to me?",
    a: "No. CareCircle sends it directly to the hospital named on the bill. You never handle the money, which is why relatives can trust the page.",
  },
  {
    q: "Who checks the bill?",
    a: "First, AI reads the bill and explains each charge. It also points out anything that looks wrong, such as a total that does not add up. Then a CareCircle reviewer looks at everything and decides. The AI never makes the decision.",
  },
  {
    q: "Do relatives need an account?",
    a: "No. They open the link you share, choose an amount and pay with PayPal, or with a debit or credit card if they have no PayPal account. In the US they can also use Venmo. They can add their name and a short message, or stay anonymous.",
  },
  {
    q: "What if the fundraiser is cancelled?",
    a: "If the treatment does not go ahead, or a reviewer finds a problem after payments came in, the reviewer cancels the fundraiser and every payment is returned in full through PayPal. Each refund is listed on the fundraiser page.",
  },
  {
    q: "How does CareCircle stop fake fundraisers?",
    a: "AI reads the name of the hospital printed on the bill, and CareCircle checks it against the hospital that would be paid. If they differ, the family and the reviewer see a warning before anyone can pay. A person still makes the final decision.",
  },
  {
    q: "Why are amounts in US dollars?",
    a: "Relatives abroad pay through PayPal in US dollars. The bill itself stays in its own currency, such as rupees, and the reviewer approves a dollar amount after checking it.",
  },
  {
    q: "How do relatives know the money was used properly?",
    a: "Every payment in, and the payment out to the hospital, is listed on the fundraiser page. After the hospital is paid, the family uploads the hospital's receipt for everyone to see.",
  },
  {
    q: "Is this real money?",
    a: "Not yet. This demo runs on PayPal's test system with made-up bills. No real money moves.",
  },
];

const EXAMPLE_PAYMENTS = [
  { name: "Priya, his niece", note: "Get well soon, Mama!", amount: "+$250.00" },
  { name: "Rahul (Toronto)", note: null, amount: "+$200.00" },
  { name: "Anonymous", note: "Praying for you.", amount: "+$165.00" },
];

/** What a relative sees when they open the link: a static picture, not live data. */
function ExampleFundraiser() {
  return (
    <div id="example" className="flex scroll-mt-24 flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/[0.04] sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted">Example fundraiser page</span>
        <span className="inline-flex items-center gap-1 text-xs text-muted">
          <Icon name="lock" className="h-3.5 w-3.5" /> carecircle.app/f/…
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <VerifiedSeal approvedCents={96000} />
        <h3 className="text-xl font-semibold tracking-tight">Knee surgery for Papa</h3>
        <p className="text-sm text-muted">
          Money goes only to <span className="font-medium text-foreground">Sunrise Test Hospital, Pune</span>
        </p>
      </div>
      <Progress raisedCents={61500} approvedCents={96000} large />
      <TrustTrack status="open" compact />
      <ul className="flex flex-col divide-y divide-border text-sm">
        {EXAMPLE_PAYMENTS.map((payment) => (
          <li key={payment.name} className="flex items-start justify-between gap-3 py-2.5">
            <span className="flex flex-col">
              <span className="font-medium">{payment.name}</span>
              {payment.note && <span className="text-muted">&ldquo;{payment.note}&rdquo;</span>}
            </span>
            <span className="font-semibold tabular-nums text-success">{payment.amount}</span>
          </li>
        ))}
      </ul>
      <div className="rounded-lg bg-accent py-2.5 text-center text-sm font-semibold text-accent-foreground">Help with PayPal</div>
    </div>
  );
}

function MoneyFlow() {
  const stops: { icon: IconName; title: string; body: string; highlight?: boolean }[] = [
    { icon: "users", title: "Relatives", body: "Pay with PayPal from any country" },
    { icon: "lock", title: "CareCircle", body: "Holds the money until the reviewer sends it", highlight: true },
    { icon: "hospital", title: "The hospital", body: "The only place the money can go" },
  ];
  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      {stops.map((stop, i) => (
        <li key={stop.title} className="flex flex-1 flex-col items-center gap-3 sm:flex-row">
          <div
            className={`flex w-full flex-1 flex-col items-center gap-2 rounded-xl border p-5 text-center ${
              "border-border bg-card"
            }`}
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${stop.highlight ? "bg-accent-soft text-accent" : "bg-subtle text-foreground"}`}>
              <Icon name={stop.icon} />
            </span>
            <span className="font-semibold">{stop.title}</span>
            <span className="text-sm text-muted">{stop.body}</span>
          </div>
          {i < stops.length - 1 && (
            <span className="rotate-90 text-muted sm:rotate-0" aria-hidden>
              <Icon name="arrowRight" />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

export default async function Home() {
  const user = await getCurrentUser().catch(() => null);
  if (user?.role === "family") redirect("/funds");
  if (user?.role === "reviewer") redirect("/review");

  return (
    <main className="flex flex-col">
      {/* What it is, in one sentence. */}
      <section className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-16 pt-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-20">
        <div className="flex flex-col gap-6">
          <span className="self-start rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted">
            Fundraising for hospital bills, with PayPal and AI
          </span>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl xl:text-6xl">
            Raise money for a hospital bill. <span className="text-muted">The money goes straight to the hospital.</span>
          </h1>
          <p className="text-lg leading-8 text-muted">
            Upload the bill, have it checked, and share one link. Relatives pay with PayPal from any country, and
            everyone can see exactly where their money went.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className={`${primaryButton} px-5 py-3 text-base`}>
              Start a fundraiser
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link href="#how-it-works" className={`${secondaryButton} px-5 py-3 text-base`}>
              How it works
            </Link>
          </div>
          <p className="text-sm text-muted">Free to use. Relatives do not need an account.</p>
        </div>
        <ExampleFundraiser />
      </section>

      {/* The three promises. */}
      <section className="border-y border-border bg-card">
        <ul className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3">
          {PROMISES.map((promise) => (
            <li key={promise.title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Icon name={promise.icon} />
              </span>
              <div>
                <h2 className="font-semibold">{promise.title}</h2>
                <p className="text-sm text-muted">{promise.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Who it is for. */}
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Who uses CareCircle</h2>
          <p className="mt-2 text-muted">Three kinds of people take part. Pick the one that describes you.</p>
        </div>
        <ul className="grid gap-4 md:grid-cols-3">
          {AUDIENCES.map((audience) => (
            <li key={audience.who}>
              <Link
                href={audience.link.href}
                className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5 transition hover:border-accent/50 hover:shadow-md hover:shadow-black/[0.03]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-subtle text-foreground">
                  <Icon name={audience.icon} />
                </span>
                <span className="text-sm font-medium text-muted">{audience.who}</span>
                <span className="text-lg font-semibold leading-snug">{audience.title}</span>
                <span className="text-sm leading-6 text-muted">{audience.body}</span>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-accent">
                  {audience.link.label}
                  <Icon name="arrowRight" className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works. */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
            <p className="mt-2 text-muted">Four steps, from the hospital bill to the hospital&apos;s receipt.</p>
          </div>
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Icon name={step.icon} />
                  </span>
                  <span className="text-sm font-semibold text-muted">Step {i + 1}</span>
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm leading-6 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Where the money goes. */}
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Where the money goes</h2>
          <p className="mt-2 text-muted">
            On most fundraising sites, the money goes to whoever made the page. On CareCircle, it can only go to the
            hospital that wrote the bill.
          </p>
        </div>
        <MoneyFlow />
      </section>

      {/* Questions. */}
      <section id="questions" className="scroll-mt-20 border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Common questions</h2>
          <div className="flex max-w-3xl flex-col divide-y divide-border border-y border-border">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {item.q}
                  <span className="text-muted transition group-open:rotate-45">
                    <Icon name="plus" />
                  </span>
                </summary>
                <p className="mt-2 pr-8 text-sm leading-6 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Try it. */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12">
        <div className="flex flex-col items-start gap-5 rounded-2xl border border-border bg-card p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Try the whole journey</h2>
            <p className="mt-1 text-muted">
              Sign in with a demo account, upload a sample bill, and follow the money to the hospital.
            </p>
          </div>
          <Link href="/login" className={`${primaryButton} shrink-0 px-5 py-3`}>
            Open the demo
          </Link>
        </div>
      </section>
    </main>
  );
}
