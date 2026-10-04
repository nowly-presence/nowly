# Account

Nowly accounts on nowly.me (Discord only for now). Rendered by `app/[locale]/extension/connect` (`extension-connect-view.tsx`) and `app/[locale]/account` (`account-view.tsx`). Both pages are `noIndex` and are not linked from the navigation: the extension opens the first one, the second one is reached from there or from the privacy policy.

## How sign-in works

- There is no Better Auth client package here. `lib/account-api.ts` calls the API directly with `credentials: "include"`: `POST /auth/sign-in/social` (`{ provider: "discord", callbackURL }`, then redirect to the returned `url`), `POST /auth/sign-out`, and the account routes of `apps/api/src/features/account` (`/me`, `/me/devices`, `/me/export`, `DELETE /me`, `POST /extension/tokens`).
- The session cookie is set by the API on `.nowly.me`, so nowly.me and api.nowly.me share it. Locally the API trusts `localhost:3000` outside production.
- The callback URL is the current page (query string included), so the user lands back on `/extension/connect?source=extension&device=...` after Discord.

## Extension connect flow

1. `GET /me`: `401` shows "Continue with Discord".
2. Signed in: detect the extension (`subscribeExtensionDetected`). Not detected: install message.
3. `POST /extension/tokens` with `{ deviceId: ?device, scopes: ["sync"] }`, then `requestExtension("NOWLY_SESSION", session)` and wait for `NOWLY_SESSION_RESULT` (`{ ok }`). With `?source=extension` it starts on its own, otherwise behind a button.
4. "Not you? Switch account" signs out of the site and restarts the flow.

The session payload is exactly the `POST /extension/tokens` response (`{ token, user, providers, expiresAt }`). Do not reshape it: the extension validates it and then calls `GET /me` with the token.

## Gotchas

- Account deletion and export use the site session only (cookie), never an extension token. Keep the `window.confirm` before `DELETE /me`.
- The extension keeps working without an account. Never gate a site feature on being signed in without asking first.

## Notable dependencies
`lib/extension-bridge.ts` (`NOWLY_SESSION`), `lib/presence-api.ts` (`presenceApiBaseUrl`), `components/extension-store-button.tsx`, `@nowly/ui`.
