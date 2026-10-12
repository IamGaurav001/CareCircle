// Where PayPal sends the buyer after the payout test's checkout (scripts/paypal-test.ts).
export default async function PaypalTestReturn({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { cancelled } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-3 p-8">
      <h1 className="text-2xl font-semibold">
        {cancelled ? "Payment cancelled" : "Payment approved"}
      </h1>
      <p>
        {cancelled
          ? 'Nothing was charged. Run "npm run paypal:test -- order" to try again.'
          : 'Go back to the terminal and run "npm run paypal:test -- capture".'}
      </p>
    </main>
  );
}
