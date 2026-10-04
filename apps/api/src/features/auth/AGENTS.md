# Auth

Discord OAuth (better-auth) + a secret-based admin guard, used across the API. Better Auth serves apps/insights (admin) and apps/web (Nowly accounts, see `features/account`).

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

## Better Auth configuration

- Discord only. `mapProfileToUser` copies the Discord user id into `User.discordId` (`input: false`, so clients cannot set it).
- `authTrustedOrigins()` is the single list of browser origins: `FRONTEND_URL`, `INSIGHTS_URL`, plus `localhost:3000` / `127.0.0.1:3000` outside production. `index.ts` reuses it for CORS.
- Cookies are shared on `.nowly.me` (`crossSubDomainCookies`) so nowly.me can call the API with `credentials: "include"`.

## Gotchas
- Never simplify the fail-closed check into "if no secret configured, allow everyone": that pattern exists because a misconfigured `API_SECRET_KEY` in production must lock the route down, not open it up.

## Notable dependencies
`@nowly/env/server` (`API_SECRET_KEY`). Consumed by `status` (`requireCronAuth` follows the same pattern) and any route requiring admin access.
