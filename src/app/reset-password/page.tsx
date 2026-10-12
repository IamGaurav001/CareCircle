import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth-forms";
import { AuthCard } from "@/components/ui";
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
    <main className="mx-auto flex w-full max-w-md px-4 py-12 md:py-16">
      <AuthCard title="Choose a new password" description="You will stay signed in after you save it.">
        <ResetPasswordForm />
      </AuthCard>
    </main>
  );
}
