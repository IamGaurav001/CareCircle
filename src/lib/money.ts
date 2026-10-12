/** Formats integer cents (or any currency's minor units) as "12.34 USD". */
export function formatMoney(minor: number, currency = "USD"): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

/** Converts PayPal's decimal string ("10.00") to integer cents. */
export function toCents(value: string): number {
  return Math.round(Number(value) * 100);
}

/** Converts integer cents to PayPal's decimal string. */
export function toPaypalValue(cents: number): string {
  return (cents / 100).toFixed(2);
}
