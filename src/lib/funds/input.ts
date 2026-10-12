import { z } from "zod";

/** What a family types when creating or editing a fundraiser. */
export const fundInput = z.object({
  title: z.string().trim().min(3).max(120),
  purpose: z.string().trim().min(10).max(2000),
  payeeName: z.string().trim().min(2).max(120),
  payeePaypalEmail: z.email(),
  requestedCents: z.number().int().positive().max(10_000_000), // up to 100,000 USD
});
