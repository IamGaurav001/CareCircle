// Creates the three demo accounts and the private `documents` bucket (tab 4 of the plan doc).
// Safe to run again: existing accounts and the bucket are left as they are.
//
// Usage: npm run db:seed
// Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, DATABASE_URL and DEMO_PASSWORD in .env.local,
// and the tables created with `npm run db:migrate`.

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "../src/lib/db/schema";

loadEnvConfig(process.cwd());

const DEMO_USERS = [
  { email: "family.demo@example.com", name: "Demo Family", role: "family" },
  { email: "family2.demo@example.com", name: "Second Demo Family", role: "family" },
  { email: "reviewer.demo@example.com", name: "Demo Reviewer", role: "reviewer" },
] as const;

const {
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  SUPABASE_SECRET_KEY: secretKey,
  DATABASE_URL: databaseUrl,
  DEMO_PASSWORD: password,
} = process.env;
if (!supabaseUrl || !secretKey || !databaseUrl || !password) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, DATABASE_URL and DEMO_PASSWORD in .env.local first.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
const sql = postgres(databaseUrl, { prepare: false });
const db = drizzle(sql);

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  for (const demo of DEMO_USERS) {
    let id = data.users.find((user) => user.email === demo.email)?.id;
    if (id) {
      console.log(`exists   ${demo.email} (${demo.role})`);
    } else {
      const created = await supabase.auth.admin.createUser({ email: demo.email, password, email_confirm: true });
      if (created.error) throw created.error;
      id = created.data.user.id;
      console.log(`created  ${demo.email} (${demo.role})`);
    }
    await db
      .insert(users)
      .values({ id, name: demo.name, email: demo.email, role: demo.role })
      .onConflictDoUpdate({ target: users.id, set: { name: demo.name, role: demo.role } });
  }

  const bucket = await supabase.storage.createBucket("documents", { public: false });
  if (bucket.error && !/already exists/i.test(bucket.error.message)) throw bucket.error;
  console.log("ready    private documents bucket");
  console.log("\nSign in at http://localhost:3000/login with any account above and DEMO_PASSWORD from .env.local.");
}

main()
  .then(() => sql.end())
  .catch(async (error: unknown) => {
    console.error(error);
    await sql.end();
    process.exit(1);
  });
