import "server-only";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

// Decisions made by CareCircle's automatic check are recorded under this account, so the
// history shows who decided: the automatic check, or a named member of the review team.
export const AUTOMATIC_CHECK_ID = "00000000-0000-4000-8000-000000000001";

/** Creates the automatic check's account the first time it is needed. */
export async function ensureAutomaticCheck(executor: Pick<typeof db, "insert"> = db) {
  await executor
    .insert(users)
    .values({
      id: AUTOMATIC_CHECK_ID,
      name: "CareCircle automatic check",
      email: "automatic-check@carecircle.invalid",
      role: "reviewer",
    })
    .onConflictDoNothing();
}
