import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

// prepare: false because Supabase's transaction pooler does not support prepared statements.
const client = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
