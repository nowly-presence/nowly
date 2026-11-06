CREATE TABLE "presence_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"reporter_id" text,
	"device_id" text,
	"secret_hash" text NOT NULL,
	"anonymous" boolean DEFAULT true NOT NULL,
	"reporter_label" text,
	"reporter_source" text DEFAULT 'none' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"assignee_id" text,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notify" boolean DEFAULT false NOT NULL,
	"last_message_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"reporter_read_at" timestamp (6) with time zone,
	"staff_read_at" timestamp (6) with time zone,
	"auto_close_at" timestamp (6) with time zone,
	"resolved_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presence_report_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"author_id" text,
	"author_role" text NOT NULL,
	"kind" text DEFAULT 'message' NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"choices" jsonb,
	"answer_to" text,
	"status_to" text,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "presence_reports" ADD CONSTRAINT "presence_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "presence_reports" ADD CONSTRAINT "presence_reports_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "presence_report_messages" ADD CONSTRAINT "presence_report_messages_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."presence_reports"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "presence_report_messages" ADD CONSTRAINT "presence_report_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "presence_reports_device_id_last_message_at_idx" ON "presence_reports" USING btree ("device_id","last_message_at");--> statement-breakpoint
CREATE INDEX "presence_reports_reporter_id_last_message_at_idx" ON "presence_reports" USING btree ("reporter_id","last_message_at");--> statement-breakpoint
CREATE INDEX "presence_reports_status_last_message_at_idx" ON "presence_reports" USING btree ("status","last_message_at");--> statement-breakpoint
CREATE INDEX "presence_reports_slug_idx" ON "presence_reports" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "presence_report_messages_report_id_created_at_idx" ON "presence_report_messages" USING btree ("report_id","created_at");