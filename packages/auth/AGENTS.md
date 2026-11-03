# Auth

Better Auth configuration shared by the apps. `@nowly/auth/server` exports `createAuth(db, options)` and `authTrustedOrigins(frontendUrl, production)`.

- Drizzle adapter on `@nowly/database` (`user`, `session`, `account`, `verification` tables). No other table is read by Better Auth.
- Discord is the only provider. `discordId` comes from the Discord profile and `role` defaults to `user`; neither is client-settable (`input: false`). Never add a provider or a writable field without an explicit decision.
- `basePath` is `/auth`; cookies are shared on `.nowly.me` in production. Local web origins are trusted outside production only.
- The package takes its configuration as arguments and never imports `@nowly/env`: each app passes its own env (`apps/api/src/features/auth/better-auth.ts`).
