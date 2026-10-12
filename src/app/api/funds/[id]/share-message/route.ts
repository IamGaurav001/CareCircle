import { writeShareMessages } from "@/lib/ai/share-message";
import { requireRole } from "@/lib/auth";
import { getFund } from "@/lib/funds";
import { HttpError, route, uuidParam } from "@/lib/http";
import { getBalanceCents, getPaidOutCents } from "@/lib/ledger";
import { HOUR, withinLimit } from "@/lib/rate-limit";

// Family asks the AI to draft the message they send with their link, in English and Hindi.
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("family");
  const fund = await getFund(uuidParam((await params).id));
  if (fund.ownerId !== user.id) throw new HttpError(404, "Not found");
  if (fund.status !== "open") throw new HttpError(409, "A message can be written once the fundraiser is accepting payments");
  if (!(await withinLimit(`share-message:${user.id}`, 20, HOUR))) {
    throw new HttpError(429, "Too many messages written in the last hour. Please try again later.");
  }

  const raisedCents = (await getBalanceCents(fund.id)) + (await getPaidOutCents(fund.id));
  try {
    const messages = await writeShareMessages({
      title: fund.title,
      purpose: fund.purpose,
      payeeName: fund.payeeName,
      approvedCents: fund.approvedCents ?? 0,
      raisedCents,
      link: `${new URL(request.url).origin}/f/${fund.id}`,
    });
    return Response.json(messages);
  } catch (error) {
    console.error("Gemini could not write the share message", error);
    throw new HttpError(502, "The AI could not write a message right now. Please try again.");
  }
});
