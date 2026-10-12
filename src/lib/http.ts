import { z } from "zod";

/** An error with an HTTP status, turned into a JSON response by `route`. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

/** Wraps a route handler so thrown HttpErrors become JSON responses and anything else a 500. */
export function route<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof HttpError) {
        return Response.json({ error: error.message, details: error.details }, { status: error.status });
      }
      console.error(error);
      return Response.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}

/** Parses a JSON request body against a schema, or throws a 400 listing what is wrong. */
export async function parseBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
  const json = await request.json().catch(() => {
    throw new HttpError(400, "Request body must be JSON");
  });
  const result = schema.safeParse(json);
  if (!result.success) throw new HttpError(400, "Invalid request body", z.flattenError(result.error));
  return result.data;
}

/** Reads a uuid route param; anything that is not a uuid cannot exist, so it is a 404. */
export function uuidParam(value: string): string {
  if (!z.uuid().safeParse(value).success) throw new HttpError(404, "Not found");
  return value;
}

/** Placeholder response for API routes that are planned but not built yet. */
export function notImplemented(route: string) {
  return Response.json({ error: `${route} is not built yet` }, { status: 501 });
}
