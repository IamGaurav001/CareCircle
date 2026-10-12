import { NewFundForm } from "@/components/actions";
import { Card, Page } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";

const NEXT = [
  { title: "Upload the estimate", body: "A PDF or photo of the hospital's estimate. Try samples/estimate-clean.pdf for the demo." },
  { title: "Read the AI's explanation", body: "Every charge in plain words, with anything that looks off flagged." },
  { title: "Send it for checking", body: "A CareCircle reviewer approves an amount. Then you get a link to share with family." },
];

export default async function NewFund() {
  await requirePageRole("family");

  return (
    <Page title="Start a fundraiser" subtitle="Tell your family what the money is for, and which hospital should receive it.">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <NewFundForm />
        </Card>
        <aside className="flex flex-col gap-4">
          <h2 className="font-display text-xl font-semibold">What happens next</h2>
          <ol className="flex flex-col gap-4">
            {NEXT.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                  {i + 1}
                </span>
                <div>
                  <div className="font-semibold">{step.title}</div>
                  <p className="text-sm text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="rounded-xl bg-marigold-soft p-3 text-sm text-marigold">
            The hospital&apos;s PayPal email is fixed once the fund is approved. Money can only ever go there.
          </p>
        </aside>
      </div>
    </Page>
  );
}
