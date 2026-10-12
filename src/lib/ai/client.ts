import "server-only";
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | undefined;

/** Gemini client. Reads GEMINI_API_KEY on first use, so `next build` does not need the key. */
export function gemini(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

// Latest stable Flash model per ai.google.dev/gemini-api/docs/models (checked Oct 2026).
export const MODEL = "gemini-3.8-flash";
