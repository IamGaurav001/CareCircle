// Rough US dollar values of the currencies bills usually come in. They are only used to
// catch a fundraiser that asks for far more than its bill, so rough is good enough.
const USD_PER_UNIT: Record<string, number> = {
  USD: 1,
  INR: 0.0115,
  EUR: 1.08,
  GBP: 1.27,
  AED: 0.272,
  SAR: 0.266,
  CAD: 0.72,
  AUD: 0.65,
  SGD: 0.74,
  NPR: 0.0072,
  BDT: 0.0082,
  PKR: 0.0036,
  LKR: 0.0033,
};

/** A bill amount (in its currency's minor units) as approximate US cents, or null for an unknown currency. */
export function approxUsdCents(amountMinor: number, currency: string | null): number | null {
  const rate = currency ? USD_PER_UNIT[currency.toUpperCase()] : undefined;
  return rate == null ? null : Math.round(amountMinor * rate);
}
