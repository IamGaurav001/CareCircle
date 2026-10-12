import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { funds, reviews } from "@/lib/db/schema";
import { getFund } from "@/lib/funds";
import { HttpError, parseBody, route, uuidParam } from "@/lib/http";

const body = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("approve"),
    approvedCents: z.number().int().positive(),
    note: z.string().trim().max(2000).optional(),
  }),
  z.object({
    decision: z.literal("reject"),
    note: z.string().trim().min(3).max(2000), // the family deserves a reason
  }),
]);

// Reviewer approves or rejects the fund; approval opens contributions.
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const reviewer = await requireRole("reviewer");
  const fund = await getFund(uuidParam((await params).id));
  if (fund.status !== "in_review") throw new HttpError(409, "This fundraiser is not waiting for review");

  const input = await parseBody(request, body);
  if (input.decision === "approve" && input.approvedCents > fund.requestedCents) {
    throw new HttpError(400, "You cannot approve more than the family asked for");
  }

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(funds)
      .set(input.decision === "approve" ? { status: "open", approvedCents: input.approvedCents } : { status: "rejected" })
      .where(and(eq(funds.id, fund.id), eq(funds.status, "in_review")))
      .returning({ status: funds.status, approvedCents: funds.approvedCents });
    if (!row) throw new HttpError(409, "This fundraiser has already been reviewed");

    await tx.insert(reviews).values({
      fundId: fund.id,
      reviewerId: reviewer.id,
      stage: "fund",
      decision: input.decision,
      note: input.note,
    });
    return row;
  });

  return Response.json(updated);
});
