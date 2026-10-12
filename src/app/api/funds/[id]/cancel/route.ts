import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { funds, reviews } from "@/lib/db/schema";
import { getFund } from "@/lib/funds";
import { HttpError, parseBody, route, uuidParam } from "@/lib/http";
import { refundAll, unrefundedContributions } from "@/lib/refunds";

const body = z.object({ note: z.string().trim().max(2000).optional() });

// Reviewer cancels a fundraiser that is taking payments, and every payment goes back to
// the person who made it. On a fundraiser that is already cancelled, this retries the
// refunds that did not go through.
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const reviewer = await requireRole("reviewer");
  const fund = await getFund(uuidParam((await params).id));
  const { note } = await parseBody(request, body);

  if (fund.status === "open") {
    if (!note || note.length < 3) throw new HttpError(400, "Write the reason for cancelling. The family and everyone who paid will see it.");
    await db.transaction(async (tx) => {
      // Locks out new payments first; the release route also needs the fund to be open.
      const [cancelled] = await tx
        .update(funds)
        .set({ status: "cancelled" })
        .where(and(eq(funds.id, fund.id), eq(funds.status, "open")))
        .returning({ id: funds.id });
      if (!cancelled) throw new HttpError(409, "This fundraiser changed while you were cancelling it. Reload the page.");
      await tx.insert(reviews).values({ fundId: fund.id, reviewerId: reviewer.id, stage: "cancel", decision: "reject", note });
    });
  } else if (fund.status !== "cancelled") {
    throw new HttpError(409, "Only a fundraiser that is accepting payments can be cancelled. Money already sent to the hospital cannot be refunded here.");
  }

  const result = await refundAll(fund.id);
  const remaining = (await unrefundedContributions(fund.id)).length;
  return Response.json({ status: "cancelled", ...result, remaining });
});
