"use client";

import Link from "next/link";
import { primaryButton, secondaryButton } from "@/components/styles";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-semibold text-danger">Something went wrong</p>
      <h1 className="text-2xl font-semibold tracking-tight">This page could not load</h1>
      <p className="text-muted">It is probably a short problem on our side. Please try again in a moment.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={primaryButton}>
          Try again
        </button>
        <Link href="/" className={secondaryButton}>
          Go to the home page
        </Link>
      </div>
    </main>
  );
}
