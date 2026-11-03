import Link from "next/link";
import { redirect } from "next/navigation";
import { ScrollToHash } from "@/components/actions";
import { Avatar } from "@/components/character";
import { Actor, AiExamples, CircleVisual } from "@/components/landing";
import { primaryButton, secondaryButton } from "@/components/styles";
import { Icon, type IconName } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { listPublicFundraisers, listRecentMessages } from "@/lib/funds/queries";
import { formatUsd } from "@/lib/money";

const RAISE_STEPS = [
  { title: "Create a free account", body: "Your name, email and a password. That is all." },
  { title: "Tell us about the treatment", body: "Who it is for, which hospital, and how much you need." },
  { title: "Upload the hospital bill", body: "A photo or PDF. AI explains every charge in plain words." },
  { title: "We check the bill", body: "Usually in under a minute. Then your fundraiser is live." },
  {
    title: "Share, then send to the hospital",
    body: "Share one link on WhatsApp. When the hospital needs the money, send it with one button.",
  },
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

// What CareCircle does that ordinary fundraising does not. Each one is enforced by the code, not promised.
const DIFFERENCES: { icon: IconName; title: string; body: string; usual: string }[] = [
  {
    icon: "hospital",
    title: "The money can only reach the hospital",
    body: "PayPal holds every donation and pays the hospital named on the bill directly. The family never touches it, so it cannot be spent on anything else.",
    usual: "The money lands in the organiser's own bank account.",
  },
  {
    icon: "sparkle",
    title: "The bill is checked before anyone pays",
    body: "AI reads the hospital's bill, explains every charge, and checks the total, the hospital and the amount asked for. It takes under a minute.",
    usual: "Nobody reads the bill, if there is one at all.",
  },
  {
    icon: "receipt",
    title: "Donors see the hospital's receipt",
    body: "After the hospital is paid, its receipt is checked against the bill and shown on the same page, next to every donation.",
    usual: "Donors never find out what happened to their money.",
  },
  {
    icon: "arrowLeft",
    title: "Cancelled? Everyone gets their money back",
    body: "If the treatment does not happen, one button refunds every donor in full through PayPal, and each refund is listed.",
    usual: "It is up to the organiser.",
  },
];

// The PayPal and AI pieces behind the differences, for anyone curious how it works.
const BUILT_WITH: { name: string; job: string }[] = [
  { name: "PayPal Checkout", job: "Donations from any country, by PayPal, card or Venmo" },
  { name: "PayPal Payouts", job: "Sends the money straight to the hospital" },
  { name: "PayPal Refunds", job: "Returns every donation if a fundraiser is cancelled" },
  { name: "Gemini AI", job: "Reads bills and receipts, and writes the share message" },
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

function SectionHeading({
  eyebrow,
  children,
  intro,
  wide,
}: {
  eyebrow: string;
  children: React.ReactNode;
  intro?: string;
  /** Full-width sections put the intro beside the heading instead of under it. */
  wide?: boolean;
}) {
  return (
    <div className={wide ? "grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-16" : "max-w-2xl"}>
      <div>
        <p className="text-sm font-semibold text-accent">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{children}</h2>
      </div>
      {intro && <p className={`text-lg leading-8 text-muted ${wide ? "lg:pb-1" : "mt-3"}`}>{intro}</p>}
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
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold">
              {i + 1}
            </span>
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
  // Real numbers from live fundraisers. The page still works if the database cannot be reached.
  const [live, messages] = await Promise.all([listPublicFundraisers().catch(() => []), listRecentMessages().catch(() => [])]);
  const raisedCents = live.reduce((sum, fund) => sum + fund.raisedCents, 0);
  const donations = live.reduce((sum, fund) => sum + fund.donations, 0);

  return (
    <main className="flex flex-col">
      <ScrollToHash />
      {/* 1. What it is, and the picture that shows it. */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
          aria-hidden
        />
        <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-4 pb-16 pt-14 lg:min-h-[calc(100svh-65px)] lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10 lg:py-8">
          <div className="flex flex-col gap-6">
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              For families with loved ones far from home
            </span>
            <h1 className="text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl xl:text-[4.1rem]">
              When someone you love is in hospital, <Accent>everyone can help.</Accent>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted">
              Your cousin in London, your uncle in Toronto, your aunt in New Jersey: they all ask how they can help. Share one link.
              They give in a minute, and every dollar goes straight to the hospital, never to a person.
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
            {donations > 0 && (
              <Link
                href="/fundraisers"
                className="group inline-flex items-center gap-3 self-start rounded-full border border-border bg-card py-1.5 pl-2 pr-4 text-sm shadow-sm transition hover:border-accent/40"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                <span>
                  <span className="font-semibold tabular-nums">{formatUsd(raisedCents)}</span>{" "}
                  <span className="text-muted">
                    raised from {donations} {donations === 1 ? "donation" : "donations"} for {live.length} hospital{" "}
                    {live.length === 1 ? "bill" : "bills"}
                  </span>
                </span>
                <Icon name="arrowRight" className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
              </Link>
            )}
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {["Free for families", "No account needed to donate", "Refunded if cancelled"].map((point) => (
                <li key={point} className="flex items-center gap-1.5">
                  <Icon name="check" className="h-4 w-4 text-success" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <CircleVisual />
        </div>
      </section>

      {/* 2. What makes it different. */}
      <section id="why-different" className="scroll-mt-16 lg:scroll-mt-0 border-y border-border bg-subtle/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 lg:py-24">
          <SectionHeading
            wide
            eyebrow="What makes CareCircle different"
            intro="Online fundraising asks relatives to trust whoever made the page. CareCircle removes the need for trust: the money can only go to the hospital, and everyone can see that it did."
          >
            Other fundraisers ask you to trust a person. <Accent>We show you the bill.</Accent>
          </SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {DIFFERENCES.map((item, i) => (
              <div key={item.title} className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                    <Icon name={item.icon} className="h-6 w-6" />
                  </span>
                  <span className="font-serif text-4xl italic leading-none text-border">{i + 1}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-snug tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
                </div>
                <p className="mt-auto flex items-start gap-2 border-t border-border pt-4 text-sm text-muted">
                  <Icon name="x" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <span className="font-medium text-foreground">Usually:</span> {item.usual}
                  </span>
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <p className="text-sm font-semibold">How it is built</p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {BUILT_WITH.map((piece) => (
                <li key={piece.name} className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {piece.name}
                  </span>
                  <span className="text-sm leading-6 text-muted">{piece.job}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3. The two ways in. */}
      <section id="how-it-works" className="mx-auto flex w-full max-w-7xl scroll-mt-16 lg:scroll-mt-0 flex-col gap-10 px-4 py-16 lg:py-24">
        <SectionHeading wide eyebrow="How it works" intro="Whether you are raising money or giving it, here is exactly what happens.">
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
      <section id="the-check" className="scroll-mt-16 lg:scroll-mt-0">
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
                  It goes to the CareCircle review team. A person reads the bill, the AI&apos;s notes and your details, and approves it or
                  tells you what to fix, within 24 hours. You see exactly which check it was on your page.
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
                  People at CareCircle. They check bills and receipts, and never touch the money: only PayPal holds it, and only the
                  hospital can receive it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. The AI. */}
      <section className="border-y border-border bg-subtle/60">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
          <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              eyebrow="The AI"
              intro="AI does the slow, careful reading that a worried family has no time for. People make the decisions that matter."
            >
              AI that checks. <Accent>People who care.</Accent>
            </SectionHeading>
            <p className="flex items-start gap-2 rounded-xl border border-border p-4 text-sm leading-6 text-muted">
              <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
              The AI never moves money. It reads, explains and warns. A bill only opens without a person when every check passes.
            </p>
          </div>
          <AiExamples />
        </div>
      </section>

      {/* 6. Follow the money. */}
      <section>
        <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 lg:py-24">
          <SectionHeading
            wide
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

      {/* 7. Words from people who gave. */}
      {messages.length > 0 && (
        <section className="border-y border-border bg-subtle/60">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-16 lg:py-24">
            <SectionHeading
              wide
              eyebrow="Notes from people who gave"
              intro="Every donation can carry a few words for the family. These are the newest ones."
            >
              Money pays the bill. <Accent>Words carry the family.</Accent>
            </SectionHeading>
            <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3">
              {messages.map((note) => (
                <li key={`${note.fundId}-${note.createdAt.toISOString()}`} className="mb-5 break-inside-avoid">
                  <Link
                    href={`/f/${note.fundId}`}
                    className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-accent/40"
                  >
                    <p className="text-lg leading-7">&ldquo;{note.message}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <Avatar name={note.name} className="h-11 w-11" />
                      <span className="min-w-0 text-sm leading-tight">
                        <span className="block truncate font-medium">{note.name || "Anonymous"}</span>
                        <span className="block truncate text-muted">to {note.fundTitle}</span>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 8. Why we built it. */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 lg:py-24">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 text-center">
          <p className="text-sm font-semibold text-accent">Why we built CareCircle</p>
          <blockquote className="text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
            &ldquo;When a parent is in hospital, relatives across the world ask the same thing: <Accent>how can we help?</Accent> Sending
            money to a person feels awkward, and nobody knows where it really goes. We wanted giving to be as simple as a link, and as
            honest as a receipt.&rdquo;
          </blockquote>
          <p className="text-muted">The CareCircle team</p>
        </div>
      </section>

      {/* 9. Questions. */}
      <section id="questions" className="scroll-mt-16 lg:scroll-mt-0 border-t border-border">
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

      {/* 10. Start. */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20">
        <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-border px-6 py-16 text-center sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
            aria-hidden
          />
          <h2 className="relative max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            One bill. One link. <Accent>Everyone can help.</Accent>
          </h2>
          <p className="relative max-w-xl text-lg text-muted">
            Start a fundraiser in a few minutes, or give to one that is live right now.
          </p>
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
