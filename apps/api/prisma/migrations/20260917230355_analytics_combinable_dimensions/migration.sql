-- AlterTable
ALTER TABLE "analytics_events" ADD COLUMN     "country" TEXT,
ADD COLUMN     "source" TEXT;

-- CreateIndex
CREATE INDEX "analytics_events_key_source_idx" ON "analytics_events"("key", "source");

-- CreateIndex
CREATE INDEX "analytics_events_key_country_idx" ON "analytics_events"("key", "country");
