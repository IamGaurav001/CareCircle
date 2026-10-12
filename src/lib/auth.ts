import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { HttpError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = typeof users.$inferSelect;
type Role = CurrentUser["role"];

/**
 * The signed-in user with their CareCircle role, or null when nobody is signed in.
 * Cached per request, so the header and the page share one lookup.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [row] = await db.select().from(users).where(eq(users.id, user.id));
  if (row) return row;

  // First sign-in after sign-up. Every account people make themselves is a family;
  // reviewers are only ever created by the seed script.
  const name = String(user.user_metadata?.name ?? "").trim() || user.email?.split("@")[0] || "Family";
  await db
    .insert(users)
    // users.email is unique, so an account without one gets a placeholder of its own.
    .values({ id: user.id, name, email: user.email ?? `${user.id}@no-email.carecircle.invalid`, role: "family" })
    .onConflictDoNothing();
  const [created] = await db.select().from(users).where(eq(users.id, user.id));
  return created ?? null;
});

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
