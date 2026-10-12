ALTER TYPE "public"."fund_status" ADD VALUE 'cancelled';--> statement-breakpoint
ALTER TYPE "public"."review_stage" ADD VALUE 'cancel';--> statement-breakpoint
ALTER TABLE "ai_extractions" ADD COLUMN "provider_name" text;--> statement-breakpoint
ALTER TABLE "ai_extractions" ADD COLUMN "questions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "paypal_refund_id" text;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_paypal_refund_id_unique" UNIQUE("paypal_refund_id");