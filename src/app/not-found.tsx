import Link from "next/link";
import { primaryButton } from "@/components/styles";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-semibold text-accent">Page not found</p>
      <h1 className="text-2xl font-semibold tracking-tight">We could not find that page</h1>
      <p className="text-muted">
        The link may be wrong, or the fundraiser may not be public yet. If someone sent you this link, ask them to check it.
      </p>
      <Link href="/" className={primaryButton}>
        Go to the home page
      </Link>
    </main>
  );
}
