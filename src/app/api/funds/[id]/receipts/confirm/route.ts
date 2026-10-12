import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents, funds, reviews } from "@/lib/db/schema";
import { getFund } from "@/lib/funds";
import { HttpError, parseBody, route, uuidParam } from "@/lib/http";

const body = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approve"), note: z.string().trim().max(2000).optional() }),
  // Asking for more receipts keeps the fund open for uploads; the family sees the note.
  z.object({ decision: z.literal("reject"), note: z.string().trim().min(3).max(2000) }),
]);

// Reviewer confirms the receipts and closes the fund, or asks the family for more.
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const reviewer = await requireRole("reviewer");
  const fund = await getFund(uuidParam((await params).id));
  if (fund.status !== "receipts_due") throw new HttpError(409, `This fund is ${fund.status}, not waiting for receipts`);

  const input = await parseBody(request, body);
  const receipts = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.fundId, fund.id), eq(documents.kind, "receipt")));
  if (input.decision === "approve" && receipts.length === 0) {
    throw new HttpError(409, "The family has not uploaded any receipts yet");
  }

  const status = await db.transaction(async (tx) => {
    await tx.insert(reviews).values({
      fundId: fund.id,
      reviewerId: reviewer.id,
      stage: "receipts",
      decision: input.decision,
      note: input.note,
    });
    if (input.decision === "reject") return fund.status;

    const [closed] = await tx
      .update(funds)
      .set({ status: "closed" })
      .where(and(eq(funds.id, fund.id), eq(funds.status, "receipts_due")))
      .returning({ status: funds.status });
    if (!closed) throw new HttpError(409, "This fund was closed already");
    return closed.status;
  });

  return Response.json({ status, receipts: receipts.length });
});
