import Link from "next/link";
import { redirect } from "next/navigation";
import { Actor, AiExamples, HeroVisual } from "@/components/landing";
import { primaryButton, secondaryButton } from "@/components/styles";
import { Icon, type IconName } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

const RAISE_STEPS = [
  { title: "Create a free account", body: "Your name, email and a password. That is all." },
  { title: "Tell us about the treatment", body: "Who it is for, which hospital, and how much you need." },
  { title: "Upload the hospital bill", body: "A photo or PDF. AI explains every charge in plain words." },
  { title: "We check the bill", body: "Usually in under a minute. Then your fundraiser is live." },
  { title: "Share, then send to the hospital", body: "Share one link on WhatsApp. When the hospital needs the money, send it with one button." },
];

const DONATE_STEPS = [
  { title: "Open the link, or find the fundraiser", body: "Families share a link. You can also browse every live fundraiser." },
  { title: "See that the bill was checked", body: "The hospital, the bill and every donation so far are on the page." },
  { title: "Donate with PayPal or a card", body: "No account needed. Add your name and a message, or stay anonymous." },
  { title: "See where it went", body: "The payment to the hospital and its receipt appear on the same page." },
];

const CHECKS = [
  "AI reads the bill and explains every charge",
  "The charges add up to the total on the bill",
  "The bill is from the hospital that will be paid",
  "The amount asked for is not more than the bill",
  "Nothing on the bill looks unusual or unreadable",
  "No one else is raising money for the same bill",
];

const COMPARISON = [
  { question: "Who receives the money?", usual: "Whoever made the page", ours: "Only the hospital named on the bill" },
  { question: "Is the bill checked?", usual: "Rarely", ours: "Every bill, automatically, and by a person when needed" },
  { question: "Can donors see where it went?", usual: "Usually not", ours: "Every donation, and the hospital's receipt" },
  { question: "What if the treatment is cancelled?", usual: "It depends", ours: "Everyone is refunded through PayPal" },
  { question: "Do donors need an account?", usual: "Often", ours: "No: PayPal, a card, or Venmo in the US" },
];

const STAGES: { title: string; body: string; actors: ("ai" | "person" | "paypal" | "family")[] }[] = [
  {
    title: "Bill uploaded",
    body: "The family uploads the hospital's estimate. AI reads it and explains each charge.",
    actors: ["family", "ai"],
  },
  {
    title: "Bill verified",
    body: "Automatic checks run in seconds. Anything unusual goes to our review team, who answer within 24 hours.",
    actors: ["ai", "person"],
  },
  {
    title: "Donations",
    body: "Relatives open one link and give from any country, with PayPal, a debit or credit card, or Venmo.",
    actors: ["paypal"],
  },
  {
    title: "Hospital paid",
    body: "The family presses one button and PayPal sends the money straight to the hospital. It can go nowhere else.",
    actors: ["family", "paypal"],
  },
  {
    title: "Receipt shared",
    body: "The family uploads the hospital's receipt. AI checks it, and everyone who gave can see it.",
    actors: ["family", "ai"],
  },
];

const PAY_METHODS: { icon: IconName; title: string; body: string }[] = [
  { icon: "lock", title: "PayPal", body: "From any country PayPal works in." },
  { icon: "file", title: "Debit or credit card", body: "No PayPal account needed." },
  { icon: "users", title: "Venmo", body: "For relatives in the US." },
];

const FAQ = [
  {
    q: "How do I start a fundraiser?",
    a: "Create a free account, tell us about the treatment and the hospital, and upload the hospital's bill or estimate. We check it, usually in under a minute, and then you get a link to share.",
  },
  {
    q: "How do I donate?",
    a: "Open the link the family sent you, or find their fundraiser on the Donate page. Choose an amount and pay with PayPal, or with a debit or credit card if you have no PayPal account. You do not need a CareCircle account.",
  },
  {
    q: "Who reviews my bill, and how long does it take?",
    a: "First, an automatic check: AI reads the bill, and CareCircle checks the total, the hospital's name and the amount you asked for. If everything matches, your fundraiser goes live straight away. If something looks off, a member of the CareCircle review team looks at it and decides within 24 hours. You can see which check needs a look on your fundraiser page.",
  },
  {
    q: "Does the money come to me?",
    a: "No. Donations wait safely with PayPal until you send them, and they can only be sent to the hospital named on the bill. You never handle the money, which is why relatives can trust the page.",
  },
  {
    q: "What if the treatment is cancelled?",
    a: "Cancel the fundraiser from your page and every donation goes back in full through PayPal. Each refund is listed on the fundraiser page.",
  },
  {
    q: "How does CareCircle stop fake fundraisers?",
    a: "AI reads the hospital printed on the bill and CareCircle checks it against the hospital that would be paid. If they differ, or anything else looks off, the fundraiser does not open until a person on our team has looked at it.",
  },
  {
    q: "Why are amounts in US dollars?",
    a: "Relatives abroad give through PayPal in US dollars. The bill stays in its own currency, such as rupees, and we check that the amount you ask for is not more than the bill.",
  },
];

/** The italic accent in a heading. */
function Accent({ children }: { children: React.ReactNode }) {
  return <span className="ml-[0.08em] font-serif text-[1.08em] font-normal italic tracking-normal text-accent">{children}</span>;
}

function SectionHeading({ eyebrow, children, intro }: { eyebrow: string; children: React.ReactNode; intro?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-accent">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{children}</h2>
      {intro && <p className="mt-3 text-lg leading-8 text-muted">{intro}</p>}
    </div>
  );
}

function PathCard({
  icon,
  who,
  title,
  steps,
  cta,
  note,
}: {
  icon: IconName;
  who: string;
  title: string;
  steps: { title: string; body: string }[];
  cta: { href: string; label: string; primary?: boolean };
  note: string;
}) {
  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon name={icon} />
        </span>
        <div>
          <p className="text-sm font-medium text-muted">{who}</p>
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
      </div>
      <ol className="flex flex-col gap-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold">{i + 1}</span>
            <span className="flex flex-col">
              <span className="font-medium">{step.title}</span>
              <span className="text-sm leading-6 text-muted">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-5">
        <Link href={cta.href} className={`${cta.primary ? primaryButton : secondaryButton} self-start px-5 py-3`}>
          {cta.label}
          <Icon name="arrowRight" className="h-4 w-4" />
        </Link>
        <p className="text-sm text-muted">{note}</p>
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
      {/* 1. What it is, and the picture that shows it. */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
          aria-hidden
        />
        <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-4 pb-20 pt-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pt-20">
          <div className="flex flex-col gap-7">
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              For families facing a hospital bill, and everyone who wants to help
            </span>
            <h1 className="text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl xl:text-7xl">
              Raise money for a hospital bill. <Accent>Paid straight to the hospital.</Accent>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted">
              When someone you love is in hospital, the bill should be the last thing you worry about. Upload it, share one
              link, and let family anywhere in the world help. Every dollar goes to the hospital, and everyone can see it.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className={`${primaryButton} px-6 py-3.5 text-base`}>
                Start a fundraiser
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link href="/fundraisers" className={`${secondaryButton} px-6 py-3.5 text-base`}>
                <Icon name="heart" className="h-4 w-4 text-accent" />
                Donate
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {["Free for families", "No account needed to donate", "Refunded if cancelled"].map((point) => (
                <li key={point} className="flex items-center gap-1.5">
                  <Icon name="check" className="h-4 w-4 text-success" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* 2. What keeps it safe. */}
      <section className="border-y border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm sm:flex-row sm:items-center sm:gap-8">
          <span className="shrink-0 font-semibold">What keeps it safe</span>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-muted">
            {["Payments by PayPal", "Cards and Venmo accepted", "Paid only to the hospital", "AI reads every bill", "People review anything unusual"].map(
              (item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-muted" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      {/* 3. The two ways in. */}
      <section id="how-it-works" className="mx-auto flex w-full max-w-7xl scroll-mt-20 flex-col gap-10 px-4 py-20 lg:py-28">
        <SectionHeading eyebrow="How it works" intro="Whether you are raising money or giving it, here is exactly what happens.">
          Two ways to use CareCircle. <Accent>Both take minutes.</Accent>
        </SectionHeading>
        <div className="grid gap-6 lg:grid-cols-2">
          <PathCard
            icon="file"
            who="If you need help"
            title="Start a fundraiser"
            steps={RAISE_STEPS}
            cta={{ href: "/signup", label: "Start a fundraiser", primary: true }}
            note="Free. You never handle the money, so your family knows exactly where it goes."
          />
          <PathCard
            icon="heart"
            who="If you want to help"
            title="Donate to a fundraiser"
            steps={DONATE_STEPS}
            cta={{ href: "/fundraisers", label: "See fundraisers" }}
            note="No account needed. If the fundraiser is cancelled, you get your money back."
          />
        </div>
      </section>

      {/* 4. The check, explained. */}
      <section id="the-check" className="scroll-mt-20 border-y border-border bg-subtle/60">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="How we check every bill"
              intro="Before anyone can donate, every bill goes through the same check. Most are done in under a minute."
            >
              Checked in a minute. <Accent>A person when it matters.</Accent>
            </SectionHeading>
            <ul className="flex flex-col gap-3">
              {CHECKS.map((check) => (
                <li key={check} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                    <Icon name="check" className="h-3.5 w-3.5" />
                  </span>
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4 lg:pt-10">
            <div className="flex gap-4 rounded-2xl border border-border bg-card p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
                <Icon name="check" />
              </span>
              <div>
                <p className="font-semibold">Everything matches</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Your fundraiser goes live straight away, and you get your link to share. Most bills land here.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-border bg-card p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning">
                <Icon name="clock" />
              </span>
              <div>
                <p className="font-semibold">Something needs a closer look</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  It goes to the CareCircle review team. A person reads the bill, the AI&apos;s notes and your details, and
                  approves it or tells you what to fix, within 24 hours. You see exactly which check it was on your page.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-border bg-card p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon name="shield" />
              </span>
              <div>
                <p className="font-semibold">Who is the review team?</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  People at CareCircle. They check bills and receipts, and never touch the money: only PayPal holds it, and
                  only the hospital can receive it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. The difference. */}
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-20 lg:py-28">
        <SectionHeading eyebrow="Why it is different">
          Most fundraising sends the money to whoever made the page. <Accent>CareCircle never does.</Accent>
        </SectionHeading>
        {/* Phones: one card per question. */}
        <ul className="flex flex-col gap-3 sm:hidden">
          {COMPARISON.map((row) => (
            <li key={row.question} className="rounded-2xl border border-border p-4">
              <p className="font-semibold">{row.question}</p>
              <p className="mt-3 flex items-start gap-2 text-sm text-muted">
                <Icon name="x" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="font-medium">Usually:</span> {row.usual}
                </span>
              </p>
              <p className="mt-2 flex items-start gap-2 rounded-lg bg-accent-soft/60 p-2 text-sm font-medium">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>CareCircle: {row.ours}</span>
              </p>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-hidden rounded-2xl border border-border sm:block">
          <div className="grid grid-cols-[1.1fr_1fr_1.2fr] bg-subtle text-sm font-semibold text-muted">
            <span className="px-6 py-3" />
            <span className="px-6 py-3">Typical fundraising</span>
            <span className="flex items-center gap-2 px-6 py-3 text-foreground">
              <span className="h-2 w-2 rounded-full bg-accent" /> CareCircle
            </span>
          </div>
          {COMPARISON.map((row) => (
            <div key={row.question} className="grid grid-cols-[1.1fr_1fr_1.2fr] border-t border-border text-sm">
              <span className="px-6 py-4 font-medium">{row.question}</span>
              <span className="flex items-start gap-2 px-6 py-4 text-muted">
                <Icon name="x" className="mt-0.5 h-4 w-4 shrink-0" />
                {row.usual}
              </span>
              <span className="flex items-start gap-2 bg-accent-soft/40 px-6 py-4 font-medium">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {row.ours}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Follow the money. */}
      <section className="border-y border-border bg-subtle/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-20 lg:py-28">
          <SectionHeading
            eyebrow="Follow the money"
            intro="Every fundraiser moves through the same five stages, and everyone who helps can see which one it is in."
          >
            From the bill <Accent>to the receipt.</Accent>
          </SectionHeading>
          <ol className="relative grid gap-6 lg:grid-cols-5 lg:gap-4">
            <span className="absolute left-5 right-5 top-5 hidden h-px bg-border lg:block" aria-hidden />
            {STAGES.map((stage, i) => (
              <li key={stage.title} className="relative flex gap-4 lg:flex-col">
                <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold shadow-sm">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold">{stage.title}</h3>
                  <p className="text-sm leading-6 text-muted">{stage.body}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {stage.actors.map((actor) => (
                      <Actor key={actor} kind={actor} />
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 7. The AI. */}
      <section className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
        <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            eyebrow="The AI"
            intro="AI does the slow, careful reading that a worried family has no time for. People make the decisions that matter."
          >
            AI that checks. <Accent>People who care.</Accent>
          </SectionHeading>
          <p className="flex items-start gap-2 rounded-xl border border-border p-4 text-sm leading-6 text-muted">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            The AI never moves money. It reads, explains and warns. A bill only opens without a person when every check
            passes.
          </p>
        </div>
        <AiExamples />
      </section>

      {/* 8. Giving, and getting it back. */}
      <section className="border-y border-border bg-subtle/60">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <SectionHeading
            eyebrow="For relatives and friends"
            intro="Relatives in India, the UK, the US or anywhere else open the same link and give in a minute. If the fundraiser is cancelled before the hospital is paid, every donation goes back in full."
          >
            Give from anywhere. <Accent>Get it back if plans change.</Accent>
          </SectionHeading>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {PAY_METHODS.map((method) => (
              <div key={method.title} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-soft text-info">
                  <Icon name={method.icon} />
                </span>
                <div>
                  <p className="font-semibold">{method.title}</p>
                  <p className="text-sm text-muted">{method.body}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 sm:col-span-3 lg:col-span-1 xl:col-span-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
                <Icon name="arrowLeft" />
              </span>
              <p className="text-sm">
                <span className="font-semibold">Full refunds, automatically.</span>{" "}
                <span className="text-muted">Each refund is listed on the fundraiser page next to the donation it returns.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Why we built it. */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 lg:py-28">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 text-center">
          <p className="text-sm font-semibold text-accent">Why we built CareCircle</p>
          <blockquote className="text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
            &ldquo;When a parent is in hospital, relatives across the world ask the same thing: <Accent>how can we help?</Accent>{" "}
            Sending money to a person feels awkward, and nobody knows where it really goes. We wanted giving to be as simple
            as a link, and as honest as a receipt.&rdquo;
          </blockquote>
          <p className="text-muted">The CareCircle team</p>
        </div>
      </section>

      {/* 10. Questions. */}
      <section id="questions" className="scroll-mt-20 border-t border-border">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading eyebrow="Questions" intro="The things families and donors ask us first.">
              Common <Accent>questions.</Accent>
            </SectionHeading>
          </div>
          <div className="flex flex-col divide-y divide-border border-y border-border">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                  {item.q}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted transition group-open:rotate-45 group-open:border-accent group-open:text-accent">
                    <Icon name="plus" className="h-4 w-4" />
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl pr-10 leading-7 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Start. */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20">
        <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-border px-6 py-16 text-center sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
            aria-hidden
          />
          <h2 className="relative max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            One bill. One link. <Accent>Everyone can help.</Accent>
          </h2>
          <p className="relative max-w-xl text-lg text-muted">Start a fundraiser in a few minutes, or give to one that is live right now.</p>
          <div className="relative flex flex-wrap justify-center gap-3">
            <Link href="/signup" className={`${primaryButton} px-6 py-3.5 text-base`}>
              Start a fundraiser
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link href="/fundraisers" className={`${secondaryButton} px-6 py-3.5 text-base`}>
              <Icon name="heart" className="h-4 w-4 text-accent" />
              Donate
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
