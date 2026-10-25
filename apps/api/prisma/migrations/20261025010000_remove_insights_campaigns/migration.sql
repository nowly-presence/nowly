-- Irreversible: removes the retired campaign data.
-- Deploy only with the application that no longer references these objects.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DROP TABLE "campaign_signups";
DROP TABLE "campaigns";

COMMIT;
