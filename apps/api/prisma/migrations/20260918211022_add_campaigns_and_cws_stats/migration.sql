-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_signups" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_signups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cws_daily_stats" (
    "date" DATE NOT NULL,
    "metric" TEXT NOT NULL,
    "dimension" TEXT NOT NULL DEFAULT 'total',
    "dimension_value" TEXT NOT NULL DEFAULT 'total',
    "value" INTEGER NOT NULL,

    CONSTRAINT "cws_daily_stats_pkey" PRIMARY KEY ("date","metric","dimension","dimension_value")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaign_signups_campaign_id_email_key" ON "campaign_signups"("campaign_id", "email");

-- CreateIndex
CREATE INDEX "cws_daily_stats_metric_dimension_idx" ON "cws_daily_stats"("metric", "dimension");

-- AddForeignKey
ALTER TABLE "campaign_signups" ADD CONSTRAINT "campaign_signups_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
