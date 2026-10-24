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

const BILL_LINES = [
  { item: "Surgeon fee", amount: "₹40,000" },
  { item: "Room charges (3 days)", amount: "₹25,000" },
  { item: "Knee implant and medicines", amount: "₹15,000", note: "The artificial knee joint, and the medicines after surgery." },
];

/** The hero picture: a hospital bill the AI has read, with the fundraiser page in front of it. */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:h-[620px]" aria-label="Example: a hospital bill checked by AI, and the fundraiser page relatives see" role="img">
      {/* The bill, as the family uploaded it. */}
      <div className="relative rounded-xl border border-border bg-card p-5 shadow-[0_1px_0_rgba(0,0,0,0.02),0_12px_40px_-12px_rgba(0,0,0,0.12)] lg:absolute lg:left-0 lg:top-0 lg:w-[78%] lg:-rotate-2">
        <div className="flex items-start justify-between gap-3 border-b border-dashed border-border pb-3">
          <div>
            <p className="text-sm font-semibold tracking-wide">SUNRISE TEST HOSPITAL</p>
            <p className="text-xs text-muted">Cost estimate · Knee replacement</p>
          </div>
          <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted">EST-0001</span>
        </div>
        <ul className="flex flex-col gap-2 py-3 font-mono text-[13px]">
          {BILL_LINES.map((line) => (
            <li key={line.item}>
              <div className="flex justify-between gap-3">
                <span>{line.item}</span>
                <span className="tabular-nums">{line.amount}</span>
              </div>
              {line.note && (
                <p className="mt-1 flex gap-1.5 rounded-md bg-accent-soft px-2 py-1 font-sans text-xs text-accent">
                  <Icon name="sparkle" className="mt-0.5 h-3 w-3 shrink-0" />
                  {line.note}
                </p>
              )}
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-dashed border-border pt-3 font-mono text-[13px] font-semibold">
          <span>TOTAL</span>
          <span className="tabular-nums">₹80,000</span>
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <AiCheck text="The charges add up to the total" />
          <AiCheck text="Issued by the hospital that will be paid" />
        </div>
      </div>

      {/* The fundraiser page relatives see. */}
      <div className="relative -mt-4 ml-auto w-[88%] rounded-xl border border-border bg-card p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)] lg:absolute lg:bottom-0 lg:right-0 lg:mt-0 lg:w-[60%]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">
          <Icon name="shield" className="h-3.5 w-3.5" /> Bill checked · $960 approved
        </span>
        <p className="mt-3 font-semibold">Knee surgery for Papa</p>
        <p className="text-xs text-muted">Money goes only to Sunrise Test Hospital</p>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-2xl font-semibold tabular-nums tracking-tight">$615</span>
          <span className="text-xs text-muted">of $960</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-subtle">
          <div className="h-full w-[64%] rounded-full bg-accent" />
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-sm">
          <span>
            <span className="font-medium">Priya</span> <span className="text-muted">from London</span>
          </span>
          <span className="font-semibold tabular-nums text-success">+$250</span>
        </div>
        <div className="mt-4 rounded-lg bg-accent py-2.5 text-center text-sm font-semibold text-accent-foreground">Pay with PayPal or card</div>
      </div>

      {/* A payment arriving, to show money moving. */}
      <div className="absolute -right-2 top-6 hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs shadow-lg sm:flex lg:bottom-28 lg:left-2 lg:right-auto lg:top-auto">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        Rahul paid <span className="font-semibold">$200</span> from Toronto
      </div>
    </div>
  );
}

function AiCheck({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2 text-xs">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success-soft text-success">
        <Icon name="check" className="h-3 w-3" />
      </span>
      <span className="font-medium">{text}</span>
      <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-accent">AI</span>
    </p>
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
