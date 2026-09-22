# Insights

Analytics ingestion and querying, consumed by `apps/insights`.

- `POST /events` — ingest analytics events.
- `GET /catalog` — list available metrics/dimensions/funnels (what `apps/insights`' chat tool `listCatalog` calls first).
- `GET /views`, `GET /views/:id`, `DELETE /views/:id` — saved dashboard views.
- `GET /live` — real-time data.

## Add a new metric or dimension

1. Add it to the analytics schema in `packages/analytics` (`analyticsRegistry`, `ANALYTICS_RANGE_IDS`/`ANALYTICS_SOURCES`, etc. — that package is the single source of truth for what a metric/dimension is).
2. Add the aggregation/query logic to `insights.service.ts`.
3. Expose it through `GET /catalog` so `apps/insights`' `lib/catalog.ts` and its chat tools (`listCatalog`) can discover it without a code change on that side.
4. Whichever client is meant to emit the new metric (`apps/extension`, `apps/web`, `apps/api` itself) needs to actually call `POST /events` with it — adding the schema/aggregation alone won't produce data.

## Add a new saved-view capability (e.g. sharing a view)

Add it to `insights-views.service.ts` (the saved-views-specific service, separate from `insights.service.ts`'s querying logic) and to the corresponding route in `insights.routes.ts`.

## Notable dependencies
`packages/analytics` (event schema on the client/extension side). Consumed by `apps/insights` (features `campaigns`, `views`, `chat`). `insights-dev-seed.service.ts` seeds dev/demo data — update it if a new required field would otherwise leave seeded data invalid.
