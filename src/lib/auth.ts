import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { HttpError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = typeof users.$inferSelect;
type Role = CurrentUser["role"];

/** The signed-in user with their CareCircle role, or null when nobody is signed in. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [row] = await db.select().from(users).where(eq(users.id, user.id));
  return row ?? null;
}

/** For pages: the signed-in user with one of the roles, or a redirect to sign in. */
export async function requirePageRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) redirect("/login");
  return user;
}

/** The signed-in user if they have one of the given roles; otherwise a 401 or 403. */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Sign in first");
  if (!roles.includes(user.role)) throw new HttpError(403, `Only a ${roles.join(" or ")} can do this`);
  return user;
}
