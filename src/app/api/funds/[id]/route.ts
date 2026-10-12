import { and, eq, inArray } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { aiExtractions, documents, funds } from "@/lib/db/schema";
import { getFund } from "@/lib/funds";
import { fundInput } from "@/lib/funds/input";
import { HttpError, parseBody, route, uuidParam } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";

// A family's own draft. Once submitted, nothing here can change: the reviewer approved
// what was submitted, and the hospital is fixed from then on.
async function ownDraft(id: string) {
  const user = await requireRole("family");
  const fund = await getFund(uuidParam(id));
  if (fund.ownerId !== user.id) throw new HttpError(404, "Not found");
  if (fund.status !== "draft") throw new HttpError(409, "Only a draft can be changed");
  return fund;
}

// Family edits a draft's details.
export const PATCH = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const fund = await ownDraft((await params).id);
  const input = await parseBody(request, fundInput);

  const [updated] = await db
    .update(funds)
    .set(input)
    .where(and(eq(funds.id, fund.id), eq(funds.status, "draft")))
    .returning({ id: funds.id });
  if (!updated) throw new HttpError(409, "Only a draft can be changed");
  return Response.json(updated);
});

// Family deletes a draft, with its uploaded files.
export const DELETE = route(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const fund = await ownDraft((await params).id);

  const docs = await db.select({ id: documents.id, path: documents.storagePath }).from(documents).where(eq(documents.fundId, fund.id));
  await db.transaction(async (tx) => {
    if (docs.length > 0) {
      await tx.delete(aiExtractions).where(inArray(aiExtractions.documentId, docs.map((doc) => doc.id)));
      await tx.delete(documents).where(eq(documents.fundId, fund.id));
    }
    const [deleted] = await tx
      .delete(funds)
      .where(and(eq(funds.id, fund.id), eq(funds.status, "draft")))
      .returning({ id: funds.id });
    if (!deleted) throw new HttpError(409, "Only a draft can be deleted");
  });
  if (docs.length > 0) await createAdminClient().storage.from("documents").remove(docs.map((doc) => doc.path));

  return new Response(null, { status: 204 });
});
