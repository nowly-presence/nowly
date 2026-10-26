# Insights

Analytics ingestion endpoint. Consumes events from `@nowly/analytics` and exposes aggregated query endpoints (admin only).

- `POST /events`: ingestion (public).
- `GET /overview`, `/series`, `/funnels`, `/funnels/:id`, `/catalog`, `/views`, `GET|DELETE /views/:id`, `/live` (SSE, rate limit disabled): `requireAdmin`. `POST /dev/clear` and the dev seed are admin-only too.
- Metrics and dimensions are registry-driven: `packages/analytics` is the single source of truth; `GET /catalog` exposes it for external consumers.

## Adding a metric or dimension

1. Register it in `packages/analytics`.
2. Add the aggregation to `insights.service.ts` (saved views go in `insights-views.service.ts`).
3. Make the emitting client (`apps/extension`, `apps/web`, `apps/api`) send it through `POST /events`.
4. Update `insights-dev-seed.service.ts` if a new required field would invalidate seeded data.

Quota and live state are process-local; ingested data is sanitized, keep it that way.
