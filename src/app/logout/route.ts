import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Signs out and returns to the login page. POST only, so a link preview cannot sign anyone out.
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
