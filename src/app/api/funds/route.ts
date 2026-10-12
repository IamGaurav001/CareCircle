import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { funds } from "@/lib/db/schema";
import { parseBody, route } from "@/lib/http";

const body = z.object({
  title: z.string().trim().min(3).max(120),
  purpose: z.string().trim().min(10).max(2000),
  payeeName: z.string().trim().min(2).max(120),
  payeePaypalEmail: z.email(),
  requestedCents: z.number().int().positive().max(10_000_000), // up to 100,000 USD
});

// Family creates a draft fund.
export const POST = route(async (request: Request) => {
  const user = await requireRole("family");
  const input = await parseBody(request, body);

  const [fund] = await db
    .insert(funds)
    .values({ ...input, ownerId: user.id })
    .returning({ id: funds.id, status: funds.status });
  return Response.json(fund, { status: 201 });
});
