import { Avatar, type Look } from "@/components/character";
import { Icon, type IconName } from "@/components/ui";

// Pictures for the home page. They show made-up example data, never live data.

/** A small label for who does a step: the AI, a person, or PayPal. */
export function Actor({ kind }: { kind: "ai" | "person" | "paypal" | "family" }) {
  const style = {
    ai: { label: "AI", icon: "sparkle", tone: "bg-accent-soft text-accent" },
    person: { label: "Review team", icon: "shield", tone: "bg-success-soft text-success" },
    paypal: { label: "PayPal", icon: "lock", tone: "bg-info-soft text-info" },
    family: { label: "Family", icon: "users", tone: "bg-subtle text-foreground" },
  }[kind];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.tone}`}>
      <Icon name={style.icon as IconName} className="h-3 w-3" />
      {style.label}
    </span>
  );
}

type Person = { name: string; look: Look; city: string; amount: string; note?: string; noteSide?: "left" | "right"; spot: string };

// Six relatives whose gifts add up to the $825 on the family card.
const CIRCLE: Person[] = [
  // Spots keep every face clear of the family card in the middle.
  {
    name: "Priya",
    look: { hair: ["variant23"], glassesProbability: 0, beardProbability: 0 },
    city: "London",
    amount: "$250",
    note: "Get well soon, Papa! ❤️",
    noteSide: "right",
    spot: "left-[6%] top-0",
  },
  { name: "Rahul", look: { hair: ["variant21"], beard: ["variant05"], beardProbability: 100, glassesProbability: 0 }, city: "Toronto", amount: "$200", spot: "right-[6%] top-[3%]" },
  { name: "Meera aunty", look: { hair: ["variant61"], glasses: ["variant03"], glassesProbability: 100, beardProbability: 0 }, city: "New Jersey", amount: "$50", spot: "-left-[3%] top-[40%]" },
  { name: "Kabir", look: { hair: ["variant55"], glassesProbability: 0, beardProbability: 0 }, city: "Melbourne", amount: "$100", spot: "-right-[3%] top-[36%]" },
  { name: "Vikram", look: { hair: ["variant13"], glasses: ["variant08"], glassesProbability: 100, beardProbability: 0 }, city: "Singapore", amount: "$75", spot: "left-[10%] bottom-0" },
  {
    name: "Neha",
    look: { hair: ["variant36"], glassesProbability: 0, beardProbability: 0 },
    city: "Dubai",
    amount: "$150",
    note: "Sending love and prayers 🙏",
    noteSide: "left",
    spot: "right-[4%] bottom-[2%]",
  },
];

/** The hero picture: one family in the middle, and relatives around the world giving to the hospital bill. */
export function CircleVisual() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-[min(34rem,calc(100svh-11rem))]" role="img" aria-label="Example: relatives in London, Toronto, New Jersey, Melbourne, Singapore and Dubai giving to one family's hospital bill">
      {/* Phones: the family card, then the people helping. */}
      <div className="flex flex-col gap-4 lg:hidden">
        <FamilyCard />
        <ul className="flex flex-col gap-2">
          {CIRCLE.slice(0, 3).map((person) => (
            <li key={person.name}>
              <PersonChip {...person} />
            </li>
          ))}
        </ul>
      </div>

      {/* Large screens: the circle of care around the family. */}
      <div className="relative hidden aspect-square lg:block">
        <svg className="absolute inset-0 h-full w-full text-border" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="0.25" strokeDasharray="1 1.5" />
          <circle cx="50" cy="50" r="33" fill="none" stroke="currentColor" strokeWidth="0.25" />
        </svg>
        <div className="absolute left-1/2 top-1/2 w-[52%] -translate-x-1/2 -translate-y-1/2">
          <FamilyCard />
        </div>
        {CIRCLE.map((person) => (
          <div key={person.name} className={`absolute ${person.spot}`}>
            <PersonBubble {...person} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FamilyCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          <Avatar name="Riya" look={{ hair: ["variant28"], glassesProbability: 0, beardProbability: 0 }} className="h-14 w-14" />
          <Avatar
            name="Papa"
            look={{ hair: ["variant60"], beard: ["variant10"], beardProbability: 100, glasses: ["variant03"], glassesProbability: 100 }}
            className="h-14 w-14"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Riya, for Papa</p>
          <p className="text-xs text-muted">Pune, India</p>
        </div>
      </div>
      <p className="mt-4 font-semibold leading-snug">Knee surgery for Papa</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
        <Icon name="hospital" className="h-3.5 w-3.5 shrink-0" /> Paid only to Sunrise Test Hospital
      </p>
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
        <Icon name="shield" className="h-3.5 w-3.5" /> Bill checked
      </span>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">$825</span>
        <span className="text-xs text-muted">of $920</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-subtle">
        <div className="h-full w-[90%] rounded-full bg-accent" />
      </div>
      <p className="mt-3 text-xs text-muted">6 people in 6 countries have helped</p>
    </div>
  );
}

function PersonChip({ name, look, city, amount, note }: Person) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2.5 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-4 shadow-sm">
        <Avatar name={name} look={look} className="h-12 w-12" />
        <span className="min-w-0 text-sm leading-tight">
          <span className="block truncate font-medium">{name}</span>
          <span className="block truncate text-xs text-muted">{city}</span>
        </span>
        <span className="ml-auto pl-2 text-sm font-semibold tabular-nums text-success">+{amount}</span>
      </div>
      {note && <p className="ml-4 self-start rounded-2xl rounded-tl-sm bg-accent-soft px-3 py-1.5 text-xs text-foreground">{note}</p>}
    </div>
  );
}

/** One relative as a large face, with what they gave and, sometimes, a note in a speech bubble. */
function PersonBubble({ name, look, city, amount, note, noteSide = "right" }: Person) {
  return (
    <div className={`flex items-start gap-2 ${noteSide === "left" ? "flex-row-reverse" : ""}`}>
      <div className="flex w-24 shrink-0 flex-col items-center text-center">
        <div className="relative">
          <Avatar name={name} look={look} className="h-20 w-20 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)]" />
          <span className="absolute -bottom-1 -right-2 rounded-full bg-success px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white shadow-sm ring-2 ring-background">
            +{amount}
          </span>
        </div>
        <span className="mt-2 text-sm font-semibold leading-tight">{name}</span>
        <span className="text-xs text-muted">{city}</span>
      </div>
      {note && (
        <p
          className={`mt-3 w-36 rounded-2xl border border-border bg-card px-3 py-2 text-xs leading-5 shadow-sm ${
            noteSide === "left" ? "rounded-tr-sm" : "rounded-tl-sm"
          }`}
        >
          {note}
        </p>
      )}
    </div>
  );
}

/** Four small examples of what the AI does, each drawn as the screen shows it. */
export function AiExamples() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <AiCard title="Explains every charge" body="Each line of the bill in plain words, so the family and their relatives know what they are paying for.">
        <div className="rounded-lg border border-border bg-card p-3 text-sm">
          <div className="flex justify-between font-medium">
            <span>Room charges (3 days)</span>
            <span className="tabular-nums">₹25,000</span>
          </div>
          <p className="mt-1 text-muted">A shared room and nursing care for three nights.</p>
        </div>
      </AiCard>
      <AiCard title="Catches a total that does not add up" body="If the charges do not match the total printed on the bill, the family and the reviewer both see it.">
        <Warning text="The charges add up to ₹80,000, but the bill says ₹85,000." />
      </AiCard>
      <AiCard title="Spots the wrong payee" body="The AI reads which hospital wrote the bill. If the money would go somewhere else, it is flagged before anyone pays.">
        <Warning text='The bill is from "Sunrise Test Hospital", but the money would go to "Rahul Sharma".' />
      </AiCard>
      <AiCard title="Writes the message to share" body="A short WhatsApp message in English or Hindi, using only the fundraiser's facts. The family edits it and sends it.">
        <div className="rounded-lg border border-border bg-card p-3 text-sm leading-6">
          पापा को अगले महीने घुटने की सर्जरी की ज़रूरत है। पैसा सीधे अस्पताल को जाएगा, हमें नहीं। 🙏
        </div>
      </AiCard>
    </div>
  );
}

function AiCard({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-subtle/60 p-5">
      <div className="rounded-xl bg-background/60 p-3">{children}</div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
      </div>
    </div>
  );
}

function Warning({ text }: { text: string }) {
  return (
    <p className="flex gap-2 rounded-lg border border-warning/25 bg-warning-soft p-3 text-sm">
      <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      {text}
    </p>
  );
}
