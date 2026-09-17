-- CreateTable
CREATE TABLE "presence_likes" (
    "slug" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "liked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presence_likes_pkey" PRIMARY KEY ("slug","device_id")
);

-- CreateIndex
CREATE INDEX "presence_likes_slug_idx" ON "presence_likes"("slug");
