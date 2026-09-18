-- Recreate the product-analytics event store and drop the previous dashboard tables.
-- Device / DevicePresence / PresenceActiveDevice are left untouched aside from consent.

DROP TABLE IF EXISTS "analytics_daily_rollups";
DROP TABLE IF EXISTS "analytics_admins";

ALTER TABLE "devices" DROP COLUMN IF EXISTS "analytics_consent";

ALTER TABLE "analytics_events" DROP CONSTRAINT IF EXISTS "analytics_events_device_id_fkey";
DROP INDEX IF EXISTS "analytics_events_key_idx";
DROP INDEX IF EXISTS "analytics_events_device_id_idx";
DROP INDEX IF EXISTS "analytics_events_slug_idx";
DROP TABLE IF EXISTS "analytics_events";

CREATE TABLE "analytics_events" (
    "event_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "device_id" TEXT,
    "slug" TEXT,
    "version" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("event_id")
);

CREATE INDEX "analytics_events_key_created_at_idx" ON "analytics_events"("key", "created_at");
CREATE INDEX "analytics_events_device_id_idx" ON "analytics_events"("device_id");
