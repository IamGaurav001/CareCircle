import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth-forms";
import { isValidResetToken, RESET_COOKIE } from "@/lib/password-reset";
import { createClient } from "@/lib/supabase/server";

// Reached from the reset email, after /auth/callback has signed the person in.
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const token = (await cookies()).get(RESET_COOKIE)?.value;
  if (!user || !isValidResetToken(token, user.id)) redirect("/forgot-password");

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Choose a new password</h1>
      <div className="rounded-3xl border border-border bg-card p-6">
        <ResetPasswordForm />
      </div>
    </main>
  );
}
