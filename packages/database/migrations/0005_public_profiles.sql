CREATE TABLE "public_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"bio" text,
	"show_created" boolean DEFAULT true NOT NULL,
	"show_liked" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "public_profiles_handle_key" UNIQUE("handle")
);
--> statement-breakpoint
ALTER TABLE "public_profiles" ADD CONSTRAINT "public_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;