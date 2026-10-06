CREATE TABLE "status_samples" (
    "id" SERIAL NOT NULL,
    "service_id" TEXT NOT NULL,
    "checked_at" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL,
    "response_ms" INTEGER,
    "http_status" INTEGER,
    "error" TEXT,

    CONSTRAINT "status_samples_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "status_samples_service_id_checked_at_id_idx" ON "status_samples"("service_id", "checked_at", "id");
