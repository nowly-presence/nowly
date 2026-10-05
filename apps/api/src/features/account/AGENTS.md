# Account

Nowly accounts for the extension and nowly.me: extension tokens, the current profile, linked devices, and the account-level GDPR routes. Sign-in itself is Better Auth (`features/auth/better-auth.ts`, Discord only for now).

## Routes

| Method | Route | Guard | Role |
|---|---|---|---|
| POST | `/extension/tokens` | `requireSession` (Better Auth cookie) | Body `{ deviceId?, scopes }` (default `["sync"]`). Returns `{ token: "nxt_...", user, providers, expiresAt }`, `expiresAt` in milliseconds. Revokes the previous tokens of the same user and device. 10/min. |
| DELETE | `/extension/tokens/current` | `requireExtensionToken("sync")` | Revokes the calling token (sign out from the extension). |
| GET | `/me` | `requireTokenOrSession` | `{ id, name, image, discordId, githubLogin }` (`githubLogin` stays `null` until GitHub ships). |
| GET | `/me/devices` | `requireTokenOrSession` | Linked devices, `current` is the token's device. |
| DELETE | `/me/devices/:deviceId` | `requireSession` | Unlinks a device and revokes its tokens. |
| GET | `/me/export` | `requireSession` | GDPR access: profile, linked providers (no OAuth tokens), devices, extension tokens (no hashes), synced documents, likes. |
| DELETE | `/me` | `requireSession` | GDPR erasure: deletes the user (cascades sessions, accounts, extension tokens, sync documents), unlinks devices and likes. |

## Extension tokens

- Format `nxt_` + 32 random bytes (base64url). Only the SHA-256 (`sha256Base64Url`) is stored in `ExtensionToken.tokenHash`; the raw token is returned once.
- Scopes come from `EXTENSION_TOKEN_SCOPES` in `@nowly/shared` (`sync`, `assets`, `creator`). Only `sync` is used by the extension today.
- Expiry is 90 days, sliding: `touchExtensionToken` pushes `expiresAt` and `lastUsedAt` at most once an hour.
- `requireExtensionToken(scope)` reads `Authorization: Bearer`, rejects missing, unknown, revoked, expired or out-of-scope tokens with `401 { error: "UNAUTHORIZED" }`, and sets `request.account` (`{ userId, deviceId, scopes, tokenId }`). Read it with `accountOf(request)`.
- Every guard answers `503 DATABASE_UNAVAILABLE` without `DATABASE_URL`: no account route ever runs unauthenticated.

## Add an account-scoped route

1. Pick the guard: `requireExtensionToken(scope)` for extension calls, `requireSession` for nowly.me only (destructive or sensitive routes), `requireTokenOrSession` when both callers need it.
2. Read the user with `accountOf(request).userId`, never from the body.
3. If the route stores new per-user data, add it to `exportAccountData` and `deleteAccountData` (`account.service.ts`).

## Gotchas

- Account deletion is a cookie-only operation on purpose: a leaked extension token must not be able to erase an account.
- The nowly.me page `/extension/connect` (apps/web) calls `POST /extension/tokens` with `credentials: "include"`; the cookie is shared on `.nowly.me` (`crossSubDomainCookies`). Locally, `authTrustedOrigins()` adds `localhost:3000` outside production.

## Notable dependencies
`features/auth/better-auth.ts` (session cookie), `@nowly/shared` (scopes, token constants, `extensionTokenBodySchema`), `shared/crypto.service.ts`. Consumed by `features/sync` and `features/device` (`/devices/:deviceId/link`).
