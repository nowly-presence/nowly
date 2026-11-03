# Account

`/extension/connect` and `/account`: both `noIndex` and absent from the navigation.

- No Better Auth client: call the API through `lib/account-api.ts` (`credentials: "include"`, `cache: "no-store"`, base `presenceApiBaseUrl()`). The endpoints live in `apps/api/src/features/account`.
- The session cookie is shared on `.nowly.me`; locally the API trusts `localhost:3000` outside production.
- Discord sign-in uses the full current URL as `callbackURL` and `errorCallbackURL`, so the user returns to the same page.
- Connect flow: `GET /me` (`401` shows sign-in), detect the extension, `POST /extension/tokens` with `{ deviceId?, scopes: ["sync"] }`, pass the response unchanged to `requestExtension("NOWLY_SESSION", ...)` and wait for `NOWLY_SESSION_RESULT`. With `?source=extension` it starts once by itself.
- `?permission=creator` requests `sync` and `creator`, explains public attribution and never auto-connects: the user must click Connect.
- Deletion, export and device unlinking use the site cookie only, never an extension token. Keep the `window.confirm` before `DELETE /me` and before unlinking a device.
- The extension works without an account: never gate a site feature on sign-in without asking first.
