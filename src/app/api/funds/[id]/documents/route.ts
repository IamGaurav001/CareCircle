import { requireRole } from "@/lib/auth";
import { uploadAndRead } from "@/lib/documents";
import { getFund } from "@/lib/funds";
import { HttpError, route, uuidParam } from "@/lib/http";

// Gemini may need two tries (main model, then fallback), each up to 45 seconds.
export const maxDuration = 120;

// Family uploads the hospital estimate; Gemini reads and explains it.
export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("family");
  const fund = await getFund(uuidParam((await params).id));
  if (fund.ownerId !== user.id) throw new HttpError(404, "Not found");
  if (fund.status !== "draft") throw new HttpError(409, "The bill can only be changed while the fundraiser is a draft");

  const { document, extraction } = await uploadAndRead(request, fund, user, "estimate");
  return Response.json({ documentId: document.id, extraction }, { status: 201 });
});
