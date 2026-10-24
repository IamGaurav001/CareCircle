import Link from "next/link";
import { SignUpForm } from "@/components/auth-forms";
import { textLink } from "@/components/styles";
import { AuthCard, Icon } from "@/components/ui";

const NEXT = [
  { title: "Tell us about the treatment", body: "Who it is for, which hospital, and how much you need." },
  { title: "Upload the hospital bill", body: "A photo or PDF. AI explains every charge in plain words." },
  { title: "We check the bill", body: "Usually in under a minute. If something needs a closer look, our team checks it within 24 hours." },
  { title: "Share your link", body: "Send it to family on WhatsApp. They donate with PayPal or a card, from any country." },
  { title: "Send the money to the hospital", body: "One button, whenever the hospital needs it. It can only go to the hospital." },
];

export default function SignUpPage() {
  return (
    <main className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 md:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] md:gap-16 md:py-16 lg:gap-24">
      <AuthCard
        title="Start a fundraiser"
        description="Create your free account. It takes about a minute."
        footer={
          <>
            Already have an account?{" "}
            <Link href="/login" className={textLink}>
              Sign in
            </Link>
          </>
        }
      >
        <SignUpForm />
      </AuthCard>

      <section className="flex max-w-lg flex-col gap-6 md:pt-2">
        <div>
          <h2 className="text-lg font-semibold">What happens after you sign up</h2>
          <ol className="mt-4 flex flex-col gap-4">
            {NEXT.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                  {i + 1}
                </span>
                <span className="flex flex-col">
                  <span className="font-medium">{step.title}</span>
                  <span className="text-sm leading-6 text-muted">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <Link
          href="/fundraisers"
          className="group flex items-center gap-4 rounded-xl border border-border bg-subtle/60 p-4 transition hover:border-accent/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card text-accent">
            <Icon name="heart" />
          </span>
          <span className="flex flex-col text-sm">
            <span className="font-semibold">Here to donate instead?</span>
            <span className="text-muted">You do not need an account. Browse fundraisers and give in a minute.</span>
          </span>
          <Icon name="arrowRight" className="ml-auto h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
        </Link>
      </section>
    </main>
  );
}
