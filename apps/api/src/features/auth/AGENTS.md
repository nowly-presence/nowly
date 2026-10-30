# Auth

- Admin routes: `preHandler: requireAuth` (`auth.middleware.ts`); inline checks use `hasAdminAuth(request)`.
- Secret guards are fail-closed: when the secret is missing in production they answer `500`, never let the request through. Any new guard follows that pattern (`requireCronAuth` does). Never simplify it to "no secret configured, allow everyone".
- Better Auth: Discord only. `User.discordId` comes from the Discord profile and is not client-settable (`input: false`). `authTrustedOrigins()` is the single trusted origin list (also used for CORS). Cookies are shared on `.nowly.me`.
