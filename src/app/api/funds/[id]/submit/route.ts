import { and, eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { funds } from "@/lib/db/schema";
import { getFund, runChecks } from "@/lib/funds";
import { HttpError, route, uuidParam } from "@/lib/http";

// Family submits: runs the rule checks, then sends the fund to review.
export const POST = route(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("family");
  const fund = await getFund(uuidParam((await params).id));
  if (fund.ownerId !== user.id) throw new HttpError(404, "Not found");
  if (fund.status !== "draft") throw new HttpError(409, "This fundraiser has already been sent for review");

  const checks = await runChecks(fund);
  if (checks.some((check) => check.blocking && !check.ok)) {
    throw new HttpError(422, "This fundraiser cannot be sent for review yet", { checks });
  }

  const [updated] = await db
    .update(funds)
    .set({ status: "in_review" })
    .where(and(eq(funds.id, fund.id), eq(funds.status, "draft")))
    .returning({ status: funds.status });
  if (!updated) throw new HttpError(409, "This fundraiser has already been sent for review");

  return Response.json({ status: updated.status, checks });
});
