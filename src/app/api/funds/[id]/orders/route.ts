import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { contributions } from "@/lib/db/schema";
import { getFund } from "@/lib/funds";
import { HttpError, parseBody, route, uuidParam } from "@/lib/http";
import { getBalanceCents, getPaidOutCents } from "@/lib/ledger";
import { formatMoney, toPaypalValue } from "@/lib/money";
import { clientIp, HOUR, withinLimit } from "@/lib/rate-limit";
import { paypalRequest } from "@/lib/paypal/client";

const body = z.object({
  amountCents: z.number().int().min(100).max(1_000_000), // 1 to 10,000 USD
  // Both optional and shown on the public page; React escapes them when rendering.
  contributorName: z.string().trim().max(60).optional(),
  message: z.string().trim().max(280).optional(),
});

// Contributor (no login needed) starts a PayPal order for a contribution.
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  if (!(await withinLimit(`order:${await clientIp()}`, 30, HOUR))) {
    throw new HttpError(429, "Too many payment attempts in the last hour. Please try again later.");
  }
  const fund = await getFund(uuidParam((await params).id));
  if (fund.status !== "open") throw new HttpError(409, "This fund is not taking contributions");

  const { amountCents, contributorName, message } = await parseBody(request, body);
  // Everything raised so far counts, including money already paid out.
  const raisedCents = (await getBalanceCents(fund.id)) + (await getPaidOutCents(fund.id));
  const remainingCents = (fund.approvedCents ?? 0) - raisedCents;
  if (amountCents > remainingCents) {
    throw new HttpError(400, `This fund needs only ${formatMoney(remainingCents)} more`, { remainingCents });
  }

  const fundPage = `${new URL(request.url).origin}/f/${fund.id}`;
  const order = await paypalRequest<{ id: string; links: { rel: string; href: string }[] }>("/v2/checkout/orders", {
    method: "POST",
    requestId: randomUUID(),
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: fund.id,
          custom_id: fund.id,
          description: `CareCircle: ${fund.title}`.slice(0, 127),
          amount: { currency_code: "USD", value: toPaypalValue(amountCents) },
        },
      ],
      // The payout test showed PayPal's checkout loops without a return URL.
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "CareCircle",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: fundPage,
            cancel_url: fundPage,
          },
        },
      },
    },
  });

  await db.insert(contributions).values({
    fundId: fund.id,
    paypalOrderId: order.id,
    amountCents,
    contributorName: contributorName || null,
    message: message || null,
  });
  // Where the contributor approves the payment; PayPal then sends them back to the fund page.
  const approveUrl = order.links.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href;
  return Response.json({ id: order.id, approveUrl }, { status: 201 });
});
