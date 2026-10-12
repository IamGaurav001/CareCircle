/** Placeholder response for API routes that are planned but not built yet. */
export function notImplemented(route: string) {
  return Response.json({ error: `${route} is not built yet` }, { status: 501 });
}
