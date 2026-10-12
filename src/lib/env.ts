import "server-only";
import { z } from "zod";

// Server-side settings, checked once at startup. Copy .env.example to .env.local to fill them in.
// PayPal settings are checked in lib/paypal/client.ts instead.
const schema = z.object({
  DATABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
});

export const env = schema.parse(process.env);
