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
  // Which PayPal button the contributor chose. Without one, they are sent to PayPal's site.
  paymentSource: z.enum(["paypal", "venmo", "card"]).optional(),
});

const BRAND = { brand_name: "CareCircle", shipping_preference: "NO_SHIPPING" } as const;

/** How PayPal should present the payment, for the button the contributor chose. */
function paymentSourceFor(source: z.infer<typeof body>["paymentSource"], fundPage: string) {
  if (source === "venmo") return { payment_source: { venmo: { experience_context: BRAND } } };
  // The card button collects the card itself, so the order names no payment source.
  if (source === "card") return { application_context: BRAND };
  // The payout test showed PayPal's checkout loops without a return URL.
  return {
    payment_source: {
      paypal: { experience_context: { ...BRAND, user_action: "PAY_NOW", return_url: fundPage, cancel_url: fundPage } },
    },
  };
}

// Contributor (no login needed) starts a PayPal order for a contribution.
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  if (!(await withinLimit(`order:${await clientIp()}`, 30, HOUR))) {
    throw new HttpError(429, "Too many payment attempts in the last hour. Please try again later.");
  }
  const fund = await getFund(uuidParam((await params).id));
  if (fund.status !== "open") throw new HttpError(409, "This fundraiser is no longer taking payments");

  const { amountCents, contributorName, message, paymentSource } = await parseBody(request, body);
  // Everything raised so far counts, including money already paid out.
  const raisedCents = (await getBalanceCents(fund.id)) + (await getPaidOutCents(fund.id));
  const remainingCents = (fund.approvedCents ?? 0) - raisedCents;
  if (amountCents > remainingCents) {
    throw new HttpError(400, `Only ${formatMoney(remainingCents)} more is needed. Please enter a smaller amount.`, { remainingCents });
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
      ...paymentSourceFor(paymentSource, fundPage),
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
