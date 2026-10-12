import { NextResponse, type NextRequest } from "next/server";
import { RESET_COOKIE, resetToken } from "@/lib/password-reset";
import { createClient } from "@/lib/supabase/server";

// Where Supabase's email links land: confirming a new account, or resetting a password.
// Exchanges the one-time code for a session, then continues to `next`.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");

  // Only paths on this site. Resolving first catches tricks like "/\evil.com",
  // which browsers and URL parsers treat as "//evil.com".
  const target = new URL(url.searchParams.get("next") ?? "/", url.origin);
  const safeNext = target.origin === url.origin ? target : new URL("/", url.origin);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(safeNext);
      // Proof that this browser came from a reset email; /reset-password requires it.
      if (safeNext.pathname === "/reset-password" && data.user) {
        response.cookies.set(RESET_COOKIE, resetToken(data.user.id), {
          httpOnly: true,
          sameSite: "lax",
          secure: url.protocol === "https:",
          path: "/",
          maxAge: 15 * 60,
        });
      }
      return response;
    }
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
