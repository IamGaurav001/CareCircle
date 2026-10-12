"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isValidResetToken, RESET_COOKIE } from "@/lib/password-reset";
import { clientIp, HOUR, withinLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Sign-up, sign-in and password reset, as server actions for the forms in src/app.
// Each returns a message for the form to show, or redirects when it is done.

export type FormState = { error?: string; notice?: string };

/** Supabase's error messages, in words a family understands. */
function friendly(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("rate limit")) return "Too many sign-ups in the last hour. Please try again a little later.";
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (text.includes("invalid") && text.includes("email")) return "This email address cannot be used. Check it, or try another.";
  if (text.includes("password")) return "Choose a stronger password: at least 8 characters, not a common word.";
  return "Something went wrong creating your account. Please try again.";
}

async function origin() {
  const list = await headers();
  return `${list.get("x-forwarded-proto") ?? "http"}://${list.get("host")}`;
}

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters for the password").max(72),
});

export async function signUp(_state: FormState, form: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ip = await clientIp();
  if (!(await withinLimit(`signup:ip:${ip}`, 5, HOUR)) || !(await withinLimit("signup:all", 100, HOUR))) {
    return { error: "Too many new accounts from here in the last hour. Please try again later." };
  }

  // For now accounts are created already confirmed, with no verification email:
  // Supabase's built-in mail only reaches project members and sends two emails an hour.
  // When a mail server (Resend) is set up, switch back to supabase.auth.signUp, which
  // sends the confirmation link to `${await origin()}/auth/callback?next=/funds`.
  const created = await createAdminClient().auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { name: parsed.data.name },
  });
  if (created.error) return { error: friendly(created.error.message) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { error: "Your account is ready. Please sign in." };
  redirect("/funds");
}

export async function signIn(_state: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  });
  if (error) {
    return { error: error.message.includes("confirm") ? "Confirm your email first: open the link we sent you." : "Wrong email or password." };
  }
  redirect("/");
}

export async function requestPasswordReset(_state: FormState, form: FormData): Promise<FormState> {
  const email = z.email().safeParse(form.get("email"));
  if (!email.success) return { error: "Enter a valid email" };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${await origin()}/auth/callback?next=/reset-password`,
  });
  // The same answer whether or not the email has an account, so no one can probe for accounts.
  return { notice: "If that email has an account, a reset link is on its way." };
}

export async function updatePassword(_state: FormState, form: FormData): Promise<FormState> {
  const password = z.string().min(8).max(72).safeParse(form.get("password"));
  if (!password.success) return { error: "Use at least 8 characters for the password" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const jar = await cookies();
  // Only a browser that came from the reset email may set a new password.
  if (!user || !isValidResetToken(jar.get(RESET_COOKIE)?.value, user.id)) {
    return { error: "This reset link has expired. Ask for a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: "This reset link has expired. Ask for a new one." };
  jar.delete(RESET_COOKIE);
  redirect("/");
}
