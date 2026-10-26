# Account

Nowly accounts on nowly.me (Discord only). Pages: `app/[locale]/extension/connect` (`extension-connect-view.tsx`) and `app/[locale]/account` (`account-view.tsx`). Both are `noIndex` and absent from the navigation: the extension opens the first; the second is reached from there or from the privacy policy.

## Sign-in

- No Better Auth client here. `lib/account-api.ts` calls the API directly with `credentials: "include"` and `cache: "no-store"`. The base URL is `presenceApiBaseUrl()` from `lib/presence-api-client.ts` (`NEXT_PUBLIC_API_BASE_URL`, default `https://api.nowly.me`).
- Calls: `POST /auth/sign-in/social` (`startDiscordSignIn` sends `{ provider: "discord", callbackURL, errorCallbackURL }`, both set to the current page, then redirects to the returned `url`), `POST /auth/sign-out`, `GET /me`, `GET /me/devices`, `DELETE /me/devices/:id`, `GET /me/export`, `DELETE /me`, `POST /extension/tokens` (routes of `apps/api/src/features/account`).
- The API sets the session cookie on `.nowly.me`, shared by nowly.me and api.nowly.me. Locally the API trusts `localhost:3000` outside production.
- The callback is the full current URL, so the user returns to `/extension/connect?source=extension&device=...` after Discord.

## Extension connect flow

1. `GET /me`: `401` shows "Continue with Discord".
2. Signed in: `subscribeExtensionDetected`; if not detected, show the install message.
3. `POST /extension/tokens` with `{ deviceId: ?device, scopes: ["sync"] }` (`deviceId` omitted when absent), then `requestExtension("NOWLY_SESSION", session)` and wait for `NOWLY_SESSION_RESULT` (`{ ok }`). With `?source=extension` it starts by itself (once), otherwise behind a button.
4. "Switch account" signs out of the site and restarts the flow.

Send the `POST /extension/tokens` response (`{ token, user, providers, expiresAt }`) unchanged: the extension validates it, then calls `GET /me` with the token.

## Gotchas

- Account deletion, export and device unlinking use the site session cookie, never an extension token. Keep the `window.confirm` before `DELETE /me` and before unlinking a device.
- The extension works without an account. Never gate a site feature on sign-in without asking first.

## Notable dependencies
`lib/extension-bridge.ts`, `lib/presence-api-client.ts`, `components/extension-store-button.tsx`, `@nowly/ui`.
