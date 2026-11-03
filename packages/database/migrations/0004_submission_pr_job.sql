ALTER TABLE "presence_submissions" ADD COLUMN "pr_claimed_at" timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "presence_submissions" ADD COLUMN "pr_error" text;--> statement-breakpoint
ALTER TABLE "presence_submissions" ADD COLUMN "pr_revision" integer;