import "server-only";
import { z } from "zod";

// Server-side settings. Copy .env.example to .env.local to fill them in.
// PayPal settings are checked in lib/paypal/client.ts instead.
const schema = z.object({
  DATABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
});

let parsed: z.infer<typeof schema> | undefined;

/** The settings, checked on first use so `next build` works without them. */
export function env(): z.infer<typeof schema> {
  parsed ??= schema.parse(process.env);
  return parsed;
}
