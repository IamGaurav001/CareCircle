import "server-only";
import { GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse } from "@google/genai";
import { z } from "zod";

let client: GoogleGenAI | undefined;

/** Gemini client. Reads GEMINI_API_KEY on first use, so `next build` does not need the key. */
export function gemini(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

// Stable models per ai.google.dev/gemini-api/docs/models (checked Oct 2026). The first
// is tried first; the second takes over when it is overloaded (503) or too slow.
export const MODEL = "gemini-3.8-flash";
export const FALLBACK_MODEL = "gemini-3.5-flash-lite";

const TIMEOUT_MS = 45_000;

/**
 * Asks the main model, then the fallback when the main one is overloaded or slow. A bad
 * request or key fails the same way on every model, so those errors stop here.
 */
export async function generate(
  request: Omit<GenerateContentParameters, "model">,
): Promise<{ response: GenerateContentResponse; model: string }> {
  for (const model of [MODEL, FALLBACK_MODEL]) {
    try {
      const response = await gemini().models.generateContent({
        ...request,
        model,
        config: { ...request.config, abortSignal: AbortSignal.timeout(TIMEOUT_MS) },
      });
      return { response, model };
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (model === FALLBACK_MODEL || (status && status >= 400 && status < 500 && status !== 429)) throw error;
      console.warn(`Gemini ${model} unavailable (${status ?? "timeout"}), trying ${FALLBACK_MODEL}`);
    }
  }
  throw new Error("Gemini returned no response");
}

/** A zod schema as the JSON Schema Gemini accepts, which does not allow the $schema keyword. */
export function geminiSchema(schema: z.ZodType): Record<string, unknown> {
  const json: Record<string, unknown> = { ...z.toJSONSchema(schema) };
  delete json.$schema;
  return json;
}
