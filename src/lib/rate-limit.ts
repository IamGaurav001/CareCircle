import "server-only";
import { and, count, eq, gte, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { rateLimitHits } from "@/lib/db/schema";

/**
 * Counts one action under `key` and says whether it is within `limit` per `windowMs`.
 * Kept in the database, so it holds across serverless instances.
 */
export async function withinLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  await db.delete(rateLimitHits).where(and(eq(rateLimitHits.key, key), lt(rateLimitHits.createdAt, since)));
  const [{ hits }] = await db
    .select({ hits: count() })
    .from(rateLimitHits)
    .where(and(eq(rateLimitHits.key, key), gte(rateLimitHits.createdAt, since)));
  if (hits >= limit) return false;
  await db.insert(rateLimitHits).values({ key });
  return true;
}

/** The caller's IP address as the hosting proxy reports it, for limits on signed-out actions. */
export async function clientIp(): Promise<string> {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0].trim() || list.get("x-real-ip") || "unknown";
}

export const HOUR = 60 * 60 * 1000;
