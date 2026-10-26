CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "translations" JSONB NOT NULL,
    "kind" TEXT NOT NULL,
    "severity" INTEGER,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Announcement_kind_check" CHECK ("kind" IN ('normal', 'warning', 'maintenance')),
    CONSTRAINT "Announcement_severity_check" CHECK (("kind" = 'warning' AND "severity" IS NOT NULL AND "severity" BETWEEN 1 AND 3) OR ("kind" <> 'warning' AND "severity" IS NULL))
);
CREATE INDEX "Announcement_publishedAt_idx" ON "Announcement"("publishedAt");
