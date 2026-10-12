import "server-only";
import { GoogleGenAI } from "@google/genai";

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
