import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

// A signed, short-lived cookie proving a browser arrived from a password reset email.
// Without it, anyone at a signed-in computer could set a new password.

export const RESET_COOKIE = "cc_password_reset";
const LIFETIME_MS = 15 * 60 * 1000;

function sign(payload: string): string {
  return createHmac("sha256", env().SUPABASE_SECRET_KEY).update(payload).digest("base64url");
}

/** A token for this user, valid for 15 minutes. */
export function resetToken(userId: string): string {
  const payload = `${userId}.${Date.now() + LIFETIME_MS}`;
  return `${payload}.${sign(payload)}`;
}

/** True if the token was issued for this user and has not expired. */
export function isValidResetToken(token: string | undefined, userId: string): boolean {
  if (!token) return false;
  const [id, expires, signature] = token.split(".");
  if (id !== userId || !signature || Number(expires) < Date.now()) return false;
  const expected = Buffer.from(sign(`${id}.${expires}`));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
