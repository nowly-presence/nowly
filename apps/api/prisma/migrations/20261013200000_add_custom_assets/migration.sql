CREATE TABLE "custom_assets" (
    "device_id" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_assets_pkey" PRIMARY KEY ("device_id", "sha256")
);

CREATE INDEX "custom_assets_last_used_at_idx" ON "custom_assets"("last_used_at");

ALTER TABLE "custom_assets" ADD CONSTRAINT "custom_assets_device_id_fkey"
    FOREIGN KEY ("device_id") REFERENCES "devices"("device_id") ON DELETE CASCADE ON UPDATE CASCADE;
