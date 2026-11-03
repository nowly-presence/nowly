CREATE TABLE "creator_presences" (
	"slug" text PRIMARY KEY NOT NULL,
	"definition" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"submission_id" text,
	"updated_by_id" text,
	"published_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presence_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"draft_id" text NOT NULL,
	"author_id" text NOT NULL,
	"kind" text NOT NULL,
	"slug" text NOT NULL,
	"base_revision" integer,
	"status" text NOT NULL,
	"translate" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"note" text,
	"pr_number" integer,
	"pr_url" text,
	"published_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presence_submission_events" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"revision" integer NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"actor_id" text,
	"note" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presence_submission_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"revision" integer NOT NULL,
	"reviewer_id" text,
	"verdict" text NOT NULL,
	"message" text NOT NULL,
	"comments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presence_submission_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"number" integer NOT NULL,
	"author_id" text,
	"definition" jsonb NOT NULL,
	"files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "creator_presences" ADD CONSTRAINT "creator_presences_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "presence_submissions" ADD CONSTRAINT "presence_submissions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "presence_submission_events" ADD CONSTRAINT "presence_submission_events_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."presence_submissions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "presence_submission_events" ADD CONSTRAINT "presence_submission_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "presence_submission_reviews" ADD CONSTRAINT "presence_submission_reviews_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."presence_submissions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "presence_submission_reviews" ADD CONSTRAINT "presence_submission_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "presence_submission_revisions" ADD CONSTRAINT "presence_submission_revisions_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."presence_submissions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "presence_submission_revisions" ADD CONSTRAINT "presence_submission_revisions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "presence_submissions_author_id_draft_id_key" ON "presence_submissions" USING btree ("author_id","draft_id");--> statement-breakpoint
CREATE INDEX "presence_submissions_status_idx" ON "presence_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "presence_submissions_slug_idx" ON "presence_submissions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "presence_submission_events_submission_id_idx" ON "presence_submission_events" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "presence_submission_reviews_submission_id_idx" ON "presence_submission_reviews" USING btree ("submission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "presence_submission_revisions_submission_id_number_key" ON "presence_submission_revisions" USING btree ("submission_id","number");