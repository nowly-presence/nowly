# Auth

- Admin routes: the `requireAuth` middleware (`auth.middleware.ts`); inline checks use `hasAdminAuth(c)`. Other shared-secret guards are built with `requireSecret(secretOf, missingError)`.
- Secret guards are fail-closed: when the secret is missing in production they answer `500`, never let the request through. Any new guard follows that pattern (`requireCronAuth` in `status.routes.ts` and `requireCleanupAuth` in `custom-assets.routes.ts` do). Never simplify it to "no secret configured, allow everyone".
- Better Auth: Discord only. `User.discordId` comes from the Discord profile and is not client-settable (`input: false`). `authTrustedOrigins()` is the single trusted origin list (also used for CORS). Cookies are shared on `.nowly.me`.
- The configuration lives in `@nowly/auth/server` (`createAuth`, Drizzle adapter on `@nowly/database`); `better-auth.ts` only wires it to `serverEnv`. Better Auth is mounted on `GET`/`POST /auth/*` in `src/app.ts` and answers with its own `Response`.
