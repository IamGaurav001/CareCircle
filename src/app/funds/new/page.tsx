import { NewFundForm } from "@/components/actions";
import { Card, Notice, Page } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";

const NEXT = [
  { title: "Upload the hospital bill", body: "A PDF or photo of the hospital's estimate. For the demo, use samples/estimate-clean.pdf." },
  { title: "Check the AI's summary", body: "It explains every charge in simple words and points out anything that looks wrong." },
  { title: "Send it for review", body: "A CareCircle reviewer approves an amount. Then you get a link to share with family." },
];

export default async function NewFund() {
  await requirePageRole("family");

  return (
    <Page
      back={{ href: "/funds", label: "My fundraisers" }}
      title="Start a fundraiser"
      description="Tell your relatives what the money is for and which hospital should receive it. You can change these details until you send the fundraiser for review."
    >
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <Card>
          <NewFundForm />
        </Card>
        <aside className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">After you save</h2>
            <ol className="mt-4 flex flex-col gap-4">
              {NEXT.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                    {i + 1}
                  </span>
                  <div className="text-sm">
                    <div className="font-medium">{step.title}</div>
                    <p className="text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <Notice tone="info" title="Money goes only to the hospital">
            Once the fundraiser is approved, the hospital&apos;s PayPal email is locked. No one can send the money anywhere else.
          </Notice>
        </aside>
      </div>
    </Page>
  );
}
