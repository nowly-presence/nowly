# API

Hono on Node (`@hono/node-server`). `src/app.ts` builds the app (`createApp()`), `src/index.ts` only serves it. Feature folders are authoritative for their routes (`src/features/<name>/AGENTS.md`).

## Layout

- `src/features/<name>/<name>.routes.ts`: a `new Hono()` router (typed `Hono<AppEnv>` when it reads `c.get("account")`), mounted in `createApp()`. Static paths are registered before parameterised ones (`/stats` before `/:slug`).
- `<name>.service.ts` (or `.repository.ts`): database and business logic, no `Context`.
- `src/middleware/`: CORS, client IP, rate limit, body limits. `src/shared/error-handler.ts`: `ApiError` becomes `{ error }` with its status, anything else a `500 INTERNAL_SERVER_ERROR`.
- `src/db/client.ts`: `getDb()` returns the lazy `@nowly/database` client; `hasDatabase()` is false without `DATABASE_URL`.

## Rules

- Guards are middlewares placed on the route (`requireAuth`, `requireExtensionToken(scope)`, `requireSession`); never check auth inside a service.
- Rate limits: `rateLimit({ name, max, windowMs, key })`. The global limit is 100 requests per minute per IP. Limits live in memory, per instance.
- Bodies: every request is capped at 1 MiB (`default-body-limit.ts`). A route needing more uses `limitBody(bytes)` and adds its prefix to `LARGER_BODY_PREFIXES`. Read JSON with `jsonBody(c)` (`undefined` when invalid) and validate with zod.
- Queries use Drizzle (`drizzle-orm` operators, `.returning()` to know what changed, `onConflictDoNothing`/`onConflictDoUpdate` for upserts, `db.transaction` with `.for("update")` for quota checks). Never build SQL from strings.
- Schema changes go through `packages/database` (see its `AGENTS.md`), never ad hoc SQL in the API.

## Tests

- `test/database.ts`: `createTestDatabase()` starts an in-memory PostgreSQL (PGlite), applies the real migrations and points `getDb()` at it; call `reset()` in `beforeEach` and `close()` in `afterAll`. `seedUser` and `seedExtensionToken` create a user and a real hashed token.
- `test/http.ts`: `mount(prefix, router)` wraps one router with the app error handlers and resets rate limits; `inject(app, { method, url, headers, payload })` sends a request and returns `{ statusCode, headers, body, json() }`.
- Assert on stored rows, not on mocked query shapes. Mock only external services (S3, email, fetch, Better Auth sessions).
- `test/*.integration.ts` run with `pnpm test:integration` against a real local PostgreSQL (`NOWLY_TEST_DATABASE_URL`, name ending in `_test`).
- Under `SKIP_ENV_VALIDATION` the env schema defaults are not applied: `test/setup.ts` sets the values the code reads.
