import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from the environment.
export const anthropic = new Anthropic();

export const MODEL = "claude-opus-5-5";
