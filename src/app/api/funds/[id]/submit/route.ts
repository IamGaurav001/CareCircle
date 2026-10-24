import { and, eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { AUTOMATIC_CHECK_ID, ensureAutomaticCheck } from "@/lib/automatic-check";
import { db } from "@/lib/db";
import { funds, reviews } from "@/lib/db/schema";
import { getFund, runChecks } from "@/lib/funds";
import { HttpError, route, uuidParam } from "@/lib/http";

// Family asks for their bill to be checked. When every check passes, the fundraiser opens
// at once for the amount asked; otherwise it goes to the review team with the checks attached.
export const POST = route(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("family");
  const fund = await getFund(uuidParam((await params).id));
  if (fund.ownerId !== user.id) throw new HttpError(404, "Not found");
  if (fund.status !== "draft") throw new HttpError(409, "This bill has already been checked");

  const checks = await runChecks(fund);
  if (checks.some((check) => check.blocking && !check.ok)) {
    throw new HttpError(422, "The bill cannot be checked yet", { checks });
  }
  const passed = checks.every((check) => check.ok);

  const status = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(funds)
      .set(passed ? { status: "open", approvedCents: fund.requestedCents } : { status: "in_review" })
      .where(and(eq(funds.id, fund.id), eq(funds.status, "draft")))
      .returning({ status: funds.status });
    if (!updated) throw new HttpError(409, "This bill has already been checked");

    if (passed) {
      await ensureAutomaticCheck(tx);
      await tx.insert(reviews).values({
        fundId: fund.id,
        reviewerId: AUTOMATIC_CHECK_ID,
        stage: "fund",
        decision: "approve",
        note: "Every check passed, so the fundraiser opened straight away.",
      });
    }
    return updated.status;
  });

  return Response.json({ status, approvedAutomatically: passed, checks });
});
