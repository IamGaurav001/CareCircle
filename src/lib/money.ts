/** Formats integer cents (or any currency's minor units) as "12.34 USD". */
export function formatMoney(minor: number, currency = "USD"): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

/** Formats integer US cents for people: "$12.34". */
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/** Formats an amount from a bill in its own currency: "₹80,000.00". */
export function formatBill(minor: number, currency: string | null): string {
  if (!currency) return (minor / 100).toFixed(2);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(minor / 100);
}

/** Converts PayPal's decimal string ("10.00") to integer cents. */
export function toCents(value: string): number {
  return Math.round(Number(value) * 100);
}

/** Converts integer cents to PayPal's decimal string. */
export function toPaypalValue(cents: number): string {
  return (cents / 100).toFixed(2);
}
