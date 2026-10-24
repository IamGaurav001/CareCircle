import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { funds, payouts, reviews } from "@/lib/db/schema";
import { getFund } from "@/lib/funds";
import { HttpError, parseBody, route, uuidParam } from "@/lib/http";
import { getBalanceCents, getPaidOutCents } from "@/lib/ledger";
import { toPaypalValue } from "@/lib/money";
import { paypalRequest } from "@/lib/paypal/client";
import { PaypalError } from "@/lib/paypal/rest";

const body = z.object({ note: z.string().trim().max(2000).optional() });

type PayoutCreated = { batch_header: { payout_batch_id: string; batch_status: string } };

// The family (or the review team) sends what was raised to the hospital through PayPal
// Payouts. It can only go to the hospital's PayPal email, which is locked once the
// fundraiser opens, and never more than the approved amount.
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("family", "reviewer");
  const fund = await getFund(uuidParam((await params).id));
  if (user.role === "family" && fund.ownerId !== user.id) throw new HttpError(404, "Not found");
  if (fund.status !== "open") throw new HttpError(409, "Only a fundraiser that is accepting payments can pay the hospital");
  const { note } = await parseBody(request, body);

  // Never more than the balance, and never more than what is still approved after earlier payouts.
  const amountCents = Math.min(
    await getBalanceCents(fund.id),
    (fund.approvedCents ?? 0) - (await getPaidOutCents(fund.id)),
  );
  if (amountCents <= 0) throw new HttpError(409, "There is no money to send yet");

  // Lock the fund and record the payout before calling PayPal, so a second release is
  // refused while this one is pending. The payout's id is PayPal's batch id, so PayPal
  // refuses a repeat of the same payout.
  const payoutId = randomUUID();
  const senderBatchId = `carecircle-${payoutId}`;
  await db.transaction(async (tx) => {
    const [locked] = await tx
      .update(funds)
      .set({ status: "releasing" })
      .where(and(eq(funds.id, fund.id), eq(funds.status, "open")))
      .returning({ id: funds.id });
    if (!locked) throw new HttpError(409, "The hospital is already being paid");

    await tx.insert(payouts).values({ id: payoutId, fundId: fund.id, senderBatchId, amountCents, status: "pending" });
    await tx.insert(reviews).values({ fundId: fund.id, reviewerId: user.id, stage: "release", decision: "approve", note });
  });

  try {
    const created = await paypalRequest<PayoutCreated>("/v1/payments/payouts", {
      method: "POST",
      body: {
        sender_batch_header: { sender_batch_id: senderBatchId, email_subject: "CareCircle payment" },
        items: [
          {
            recipient_type: "EMAIL",
            receiver: fund.payeePaypalEmail,
            amount: { value: toPaypalValue(amountCents), currency: "USD" },
            note: `CareCircle: ${fund.title}`,
            sender_item_id: payoutId,
          },
        ],
      },
    });
    await db.update(payouts).set({ paypalBatchId: created.batch_header.payout_batch_id }).where(eq(payouts.id, payoutId));
    return Response.json({ payoutId, amountCents, payoutStatus: "pending", fundStatus: "releasing" }, { status: 201 });
  } catch (error) {
    if (error instanceof PaypalError && error.status < 500) {
      // PayPal refused it, so nothing was sent: reopen the fund.
      await db.transaction(async (tx) => {
        await tx.update(payouts).set({ status: "failed" }).where(eq(payouts.id, payoutId));
        await tx.update(funds).set({ status: "open" }).where(and(eq(funds.id, fund.id), eq(funds.status, "releasing")));
      });
      throw new HttpError(502, "PayPal refused the payment to the hospital", error.details);
    }
    // No clear answer: the payout may exist, so the fund stays locked until someone checks PayPal.
    await db.update(payouts).set({ status: "unknown" }).where(eq(payouts.id, payoutId));
    throw new HttpError(502, "PayPal did not confirm the payment. Check the PayPal dashboard before trying again.");
  }
});
