import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { funds } from "@/lib/db/schema";
import { fundInput } from "@/lib/funds/input";
import { parseBody, route } from "@/lib/http";

// Family creates a draft fund.
export const POST = route(async (request: Request) => {
  const user = await requireRole("family");
  const input = await parseBody(request, fundInput);

  const [fund] = await db
    .insert(funds)
    .values({ ...input, ownerId: user.id })
    .returning({ id: funds.id, status: funds.status });
  return Response.json(fund, { status: 201 });
});
