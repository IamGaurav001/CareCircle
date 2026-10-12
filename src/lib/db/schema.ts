import {
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
]);

export const documentKind = pgEnum("document_kind", ["estimate", "receipt"]);
export const reviewStage = pgEnum("review_stage", ["fund", "release", "receipts"]);
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
});

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
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id").notNull().references(() => funds.id),
  kind: documentKind("kind").notNull(),
  storagePath: text("storage_path").notNull(),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id),
  createdAt: createdAt(),
});

export const aiExtractions = pgTable("ai_extractions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull().references(() => documents.id),
  lineItems: jsonb("line_items").notNull(),
  explanation: text("explanation").notNull(),
  flags: jsonb("flags").notNull(),
  model: text("model").notNull(),
  createdAt: createdAt(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id").notNull().references(() => funds.id),
  reviewerId: uuid("reviewer_id").notNull().references(() => users.id),
  stage: reviewStage("stage").notNull(),
  decision: reviewDecision("decision").notNull(),
  note: text("note"),
  createdAt: createdAt(),
});

export const contributions = pgTable("contributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id").notNull().references(() => funds.id),
  contributorId: uuid("contributor_id").references(() => users.id), // null for guest checkout
  paypalOrderId: text("paypal_order_id").notNull().unique(),
  paypalCaptureId: text("paypal_capture_id").unique(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull().default("created"), // created | captured | refunded
  createdAt: createdAt(),
});

// Append-only. sourceRef is the PayPal capture, refund or payout item id, so the
// same money event can never be recorded twice.
export const ledgerEntries = pgTable("ledger_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id").notNull().references(() => funds.id),
  type: ledgerType("type").notNull(),
  amountCents: integer("amount_cents").notNull(), // positive in, negative out
  sourceRef: text("source_ref").notNull().unique(),
  createdAt: createdAt(),
});

export const payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id").notNull().references(() => funds.id),
  senderBatchId: text("sender_batch_id").notNull().unique(), // reused on retry, so PayPal pays once
  paypalBatchId: text("paypal_batch_id"),
  paypalItemId: text("paypal_item_id"),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull().default("pending"), // pending | succeeded | failed
  createdAt: createdAt(),
});

export const webhookEvents = pgTable("webhook_events", {
  paypalEventId: text("paypal_event_id").primaryKey(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});
