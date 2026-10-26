# Auth

Two separate mechanisms live here; do not mix them.

- **Secret bearer** (`auth.middleware.ts`): `requireAuth` (preHandler) and `hasAdminAuth(request)` (inline boolean) compare `Authorization` with `Bearer API_SECRET_KEY`. Without a secret, `requireAuth` answers `500 API_SECRET_MISSING` in production and lets the request through otherwise (development only).
- **Better Auth session** (`require-admin.ts`): `requireAdmin` checks the signed-in user's admin role. Used by protected admin routes.

## Better Auth

- Discord only. `mapProfileToUser` copies the Discord id into `User.discordId` (`input: false`, clients cannot set it).
- `authTrustedOrigins()` is the single browser-origin list (`FRONTEND_URL`, `INSIGHTS_URL`, plus `localhost:3000`/`127.0.0.1:3000` outside production); `index.ts` reuses it for CORS.
- Cookies are shared on `.nowly.me` (`crossSubDomainCookies`).

## Rules

- A new secret-based mode follows `requireAuth`'s fail-closed pattern (also used by `requireCronAuth` in `status`). Never turn it into "no secret configured, allow everyone" in production.
