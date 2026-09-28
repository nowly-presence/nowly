-- Backfill publication dates from the publication history before enforcing the contract.
UPDATE "presences" AS p
SET "added_at" = versions."first_timestamp"
FROM (
  SELECT "slug", MIN("timestamp") AS "first_timestamp"
  FROM "presence_versions"
  GROUP BY "slug"
) AS versions
WHERE p."slug" = versions."slug"
  AND p."added_at" IS NULL;

UPDATE "presences" AS p
SET "added_at" = CURRENT_TIMESTAMP
WHERE p."added_at" IS NULL;

UPDATE "presences" AS p
SET "updated_at" = versions."last_timestamp"
FROM (
  SELECT "slug", MAX("timestamp") AS "last_timestamp"
  FROM "presence_versions"
  GROUP BY "slug"
) AS versions
WHERE p."slug" = versions."slug"
  AND p."updated_at" IS NULL;

UPDATE "presences"
SET "updated_at" = "added_at"
WHERE "updated_at" IS NULL;

ALTER TABLE "presences"
  ALTER COLUMN "added_at" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "added_at" SET NOT NULL,
  ALTER COLUMN "updated_at" SET NOT NULL;
