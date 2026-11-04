CREATE TABLE "creator_drafts" (
	"user_id" text NOT NULL,
	"draft_id" text NOT NULL,
	"value" jsonb,
	"draft_updated_at" bigint NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creator_drafts_pkey" PRIMARY KEY("user_id","draft_id")
);
--> statement-breakpoint
ALTER TABLE "creator_drafts" ADD CONSTRAINT "creator_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;