import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

function connect() {
  // prepare: false because Supabase's transaction pooler does not support prepared statements.
  return drizzle(postgres(env().DATABASE_URL, { prepare: false }), { schema });
}

type Database = ReturnType<typeof connect>;
let instance: Database | undefined;

/** The database. Connects on first use, so `next build` works without DATABASE_URL. */
export const db = new Proxy({} as Database, {
  get(_target, property) {
    instance ??= connect();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
