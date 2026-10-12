export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-32 animate-pulse rounded bg-subtle" />
      <div className="h-8 w-2/3 animate-pulse rounded bg-subtle" />
      <div className="h-24 animate-pulse rounded-xl bg-subtle" />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="h-64 animate-pulse rounded-xl bg-subtle" />
        <div className="h-64 animate-pulse rounded-xl bg-subtle" />
      </div>
    </main>
  );
}
