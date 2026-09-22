# Auth

Discord OAuth (better-auth) + a secret-based admin guard, used across the API.

## Protect a new route with the admin guard

1. In the route file, import `requireAuth` (or the `require-admin.ts` hook) from `@/features/auth/auth.middleware`.
2. Add it as a `preHandler` on the route:
   ```ts
   fastify.get("/admin-only", { preHandler: requireAuth }, async (request, reply) => { ... })
   ```
3. For an inline check instead of a route-level guard (e.g. conditionally within a shared handler), call `hasAdminAuth(request)` and branch on the boolean yourself.

## Add a new auth mode (e.g. a second bearer secret for a different caller)

1. Add the new check function to `auth.middleware.ts`, following `requireAuth`'s fail-closed pattern: if the expected secret/config is missing **and** `NODE_ENV === "production"`, return `500` rather than silently allowing the request through.
2. Export a `preHandler`-compatible wrapper from `require-admin.ts` (or a new file) so routes can opt in the same way as `requireAuth`.

## Gotchas
- Never simplify the fail-closed check into "if no secret configured, allow everyone" — that pattern exists because a misconfigured `API_SECRET_KEY` in production must lock the route down, not open it up.

## Notable dependencies
`@nowly/env/server` (`API_SECRET_KEY`). Consumed by `status` (`requireCronAuth` follows the same pattern) and any route requiring admin access.
