CREATE TABLE "extension_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"device_id" text,
	"token_hash" text NOT NULL,
	"scopes" text[],
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp (6) with time zone NOT NULL,
	"revoked_at" timestamp (6) with time zone,
	"last_used_at" timestamp (6) with time zone
);
--> statement-breakpoint
CREATE TABLE "sync_documents" (
	"user_id" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"version" integer NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_by_device_id" text,
	CONSTRAINT "sync_documents_pkey" PRIMARY KEY("user_id","key")
);
--> statement-breakpoint
CREATE TABLE "activity_publications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"local_key" text NOT NULL,
	"activity" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Announcement" (
	"id" text PRIMARY KEY NOT NULL,
	"translations" jsonb NOT NULL,
	"kind" text NOT NULL,
	"severity" integer,
	"pinned" boolean DEFAULT false NOT NULL,
	"startsAt" timestamp (3),
	"endsAt" timestamp (3),
	"expiresAt" timestamp (3),
	"publishedAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	CONSTRAINT "Announcement_kind_check" CHECK ("Announcement"."kind" IN ('normal', 'warning', 'maintenance')),
	CONSTRAINT "Announcement_severity_check" CHECK (("Announcement"."kind" = 'warning' AND "Announcement"."severity" IS NOT NULL AND "Announcement"."severity" BETWEEN 1 AND 3) OR ("Announcement"."kind" <> 'warning' AND "Announcement"."severity" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp (6) with time zone,
	"refresh_token_expires_at" timestamp (6) with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"expires_at" timestamp (6) with time zone NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"discord_id" text,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp (6) with time zone NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"updated_at" timestamp (6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_assets" (
	"device_id" text NOT NULL,
	"sha256" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"key" text NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_assets_pkey" PRIMARY KEY("device_id","sha256")
);
--> statement-breakpoint
CREATE TABLE "device_presences" (
	"device_id" text NOT NULL,
	"slug" text NOT NULL,
	"installed_version" text,
	"installed" boolean DEFAULT true NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"installed_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"uninstalled_at" timestamp (6) with time zone,
	CONSTRAINT "device_presences_pkey" PRIMARY KEY("device_id","slug")
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"device_id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"extension_version" text,
	"native_version" text,
	"browser" text,
	"os" text,
	"locale" text,
	"first_seen_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presence_active_devices" (
	"slug" text NOT NULL,
	"device_id" text NOT NULL,
	"last_seen_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "presence_active_devices_pkey" PRIMARY KEY("slug","device_id")
);
--> statement-breakpoint
CREATE TABLE "presences" (
	"slug" text PRIMARY KEY NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" text,
	"archived" boolean DEFAULT false NOT NULL,
	"added_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presence_likes" (
	"slug" text NOT NULL,
	"device_id" text NOT NULL,
	"user_id" text,
	"liked_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "presence_likes_pkey" PRIMARY KEY("slug","device_id")
);
--> statement-breakpoint
CREATE TABLE "presence_versions" (
	"slug" text NOT NULL,
	"version" text NOT NULL,
	"changelog" text DEFAULT '' NOT NULL,
	"author" text DEFAULT 'unknown' NOT NULL,
	"author_github" text,
	"release_author" text,
	"release_contributors" text,
	"pr" text,
	"source" text,
	"commit_sha" text,
	"changed_files" text,
	"bundle_size_bytes" integer,
	"bundle_size_label" text,
	"bundle_sha256" text,
	"version_type" text,
	"ai_generated_changelog" boolean,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"timestamp" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "presence_versions_pkey" PRIMARY KEY("slug","version")
);
--> statement-breakpoint
CREATE TABLE "status_samples" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" text NOT NULL,
	"checked_at" timestamp (6) with time zone NOT NULL,
	"status" text NOT NULL,
	"response_ms" integer,
	"http_status" integer,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "extension_tokens" ADD CONSTRAINT "extension_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sync_documents" ADD CONSTRAINT "sync_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "activity_publications" ADD CONSTRAINT "activity_publications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "custom_assets" ADD CONSTRAINT "custom_assets_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("device_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "device_presences" ADD CONSTRAINT "device_presences_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("device_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "presence_likes" ADD CONSTRAINT "presence_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "presence_versions" ADD CONSTRAINT "presence_versions_slug_fkey" FOREIGN KEY ("slug") REFERENCES "public"."presences"("slug") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "extension_tokens_token_hash_key" ON "extension_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "extension_tokens_user_id_idx" ON "extension_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "extension_tokens_device_id_idx" ON "extension_tokens" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "sync_documents_user_id_updated_at_idx" ON "sync_documents" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_publications_user_id_local_key_key" ON "activity_publications" USING btree ("user_id","local_key");--> statement-breakpoint
CREATE INDEX "Announcement_publishedAt_idx" ON "Announcement" USING btree ("publishedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_discord_id_key" ON "users" USING btree ("discord_id");--> statement-breakpoint
CREATE INDEX "custom_assets_last_used_at_idx" ON "custom_assets" USING btree ("last_used_at");--> statement-breakpoint
CREATE INDEX "device_presences_slug_idx" ON "device_presences" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "devices_user_id_idx" ON "devices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "presence_active_devices_device_id_idx" ON "presence_active_devices" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "presence_likes_slug_idx" ON "presence_likes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "presence_likes_user_id_idx" ON "presence_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "presence_versions_slug_idx" ON "presence_versions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "status_samples_service_id_checked_at_id_idx" ON "status_samples" USING btree ("service_id","checked_at","id");