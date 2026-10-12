import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth-forms";
import { textLink } from "@/components/styles";
import { AuthCard } from "@/components/ui";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md px-4 py-12 md:py-16">
      <AuthCard
        title="Reset your password"
        description="Enter the email you signed up with. We will send you a link to choose a new password."
        footer={
          <Link href="/login" className={textLink}>
            Back to sign in
          </Link>
        }
      >
        <ForgotPasswordForm />
      </AuthCard>
    </main>
  );
}
