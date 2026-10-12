import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Money is stored as integer US cents everywhere. A fund's balance is the sum of
// its ledger entries; it is never stored as a number of its own.
//
// Every table has row level security on and no policies, so Supabase's public API
// (reachable with the publishable key that every browser has) can neither read nor
// write them. The server connects as the table owner through DATABASE_URL, which RLS
// does not restrict.

// What the AI module stores for each estimate. Amounts on a bill are in the
// bill's own currency, in its smallest unit (paise for INR).
export type LineItem = { description: string; amountMinor: number; explanation: string };
export type AiFlag = { kind: "unclear_item" | "total_mismatch" | "unreadable" | "other"; message: string };

export const userRole = pgEnum("user_role", ["family", "contributor", "reviewer"]);

// The fund lifecycle from the Architecture tab.
export const fundStatus = pgEnum("fund_status", [
  "draft",
  "in_review",
  "rejected",
  "open",
  "releasing",
  "receipts_due",
  "closed",
  "cancelled", // stopped after payments came in; every payment is refunded
]);

export const documentKind = pgEnum("document_kind", ["estimate", "receipt"]);
export const reviewStage = pgEnum("review_stage", ["fund", "release", "receipts", "cancel"]);
export const reviewDecision = pgEnum("review_decision", ["approve", "reject"]);
export const ledgerType = pgEnum("ledger_type", ["contribution", "payout", "refund"]);

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // same id as the Supabase Auth user
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: userRole("role").notNull(),
  createdAt: createdAt(),
}).enableRLS();

export const funds = pgTable("funds", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  purpose: text("purpose").notNull(),
  payeeName: text("payee_name").notNull(),
  payeePaypalEmail: text("payee_paypal_email").notNull(),
  requestedCents: integer("requested_cents").notNull(),
  approvedCents: integer("approved_cents"),
  status: fundStatus("status").notNull().default("draft"),
  createdAt: createdAt(),
}).enableRLS();

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id").notNull().references(() => funds.id),
  kind: documentKind("kind").notNull(),
  storagePath: text("storage_path").notNull(),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id),
  createdAt: createdAt(),
}).enableRLS();

export const aiExtractions = pgTable("ai_extractions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull().references(() => documents.id),
  lineItems: jsonb("line_items").$type<LineItem[]>().notNull(),
  statedTotalMinor: integer("stated_total_minor"), // the total printed on the bill, if any
  currency: text("currency"), // as printed on the bill, e.g. INR
  providerName: text("provider_name"), // the hospital or clinic that issued it, as printed
  questions: jsonb("questions").$type<string[]>().notNull().default([]), // billing questions the family could ask
  explanation: text("explanation").notNull(),
  flags: jsonb("flags").$type<AiFlag[]>().notNull(),
  model: text("model").notNull(),
  createdAt: createdAt(),
}).enableRLS();

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id").notNull().references(() => funds.id),
  reviewerId: uuid("reviewer_id").notNull().references(() => users.id),
  stage: reviewStage("stage").notNull(),
  decision: reviewDecision("decision").notNull(),
  note: text("note"),
  createdAt: createdAt(),
}).enableRLS();

export const contributions = pgTable("contributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id").notNull().references(() => funds.id),
  contributorId: uuid("contributor_id").references(() => users.id), // null for guest checkout
  paypalOrderId: text("paypal_order_id").notNull().unique(),
  paypalCaptureId: text("paypal_capture_id").unique(),
  amountCents: integer("amount_cents").notNull(),
  contributorName: text("contributor_name"), // shown on the public page; empty means anonymous
  message: text("message"), // a note for the family, shown on the public page
  paypalRefundId: text("paypal_refund_id").unique(), // set when the payment was given back
  status: text("status").notNull().default("created"), // created | captured | refunded
  createdAt: createdAt(),
}).enableRLS();

// Append-only. sourceRef is the PayPal capture, refund or payout item id, so the
// same money event can never be recorded twice.
export const ledgerEntries = pgTable("ledger_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id").notNull().references(() => funds.id),
  type: ledgerType("type").notNull(),
  amountCents: integer("amount_cents").notNull(), // positive in, negative out
  sourceRef: text("source_ref").notNull().unique(),
  createdAt: createdAt(),
}).enableRLS();

export const payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id").notNull().references(() => funds.id),
  senderBatchId: text("sender_batch_id").notNull().unique(), // reused on retry, so PayPal pays once
  paypalBatchId: text("paypal_batch_id"),
  paypalItemId: text("paypal_item_id"),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull().default("pending"), // pending | succeeded | failed
  createdAt: createdAt(),
}).enableRLS();

export const webhookEvents = pgTable("webhook_events", {
  paypalEventId: text("paypal_event_id").primaryKey(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
}).enableRLS();

// One row per counted action, for rate limits (sign-ups, uploads, payments). Old rows
// for a key are cleared whenever that key is checked.
export const rateLimitHits = pgTable("rate_limit_hits", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull(),
  createdAt: createdAt(),
}, (table) => [index("rate_limit_hits_key_created_at").on(table.key, table.createdAt)]).enableRLS();
