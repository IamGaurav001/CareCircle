import { requireRole } from "@/lib/auth";
import { uploadAndRead } from "@/lib/documents";
import { getFund } from "@/lib/funds";
import { HttpError, route, uuidParam } from "@/lib/http";

// Family uploads a receipt; Gemini reads it and says whether it matches the approved purpose.
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("family");
  const fund = await getFund(uuidParam((await params).id));
  if (fund.ownerId !== user.id) throw new HttpError(404, "Not found");
  if (fund.status !== "receipts_due") throw new HttpError(409, "Receipts are uploaded after the hospital has been paid");

  const { document, extraction } = await uploadAndRead(request, fund, user, "receipt");
  return Response.json({ documentId: document.id, extraction }, { status: 201 });
});
