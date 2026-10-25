-- Irreversible: removes obsolete Insights events, views and activity history.
-- Deploy only with the application that no longer references these tables.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DROP TABLE "analytics_events";
DROP TABLE "insights_views";
DROP TABLE "presence_active_sessions";

COMMIT;
