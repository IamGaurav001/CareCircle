import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Signs out this browser only and returns to the login page. Supabase's default "global"
// sign-out would end the same account's sessions on every other device too.
// POST only, so a link preview cannot sign anyone out.
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
