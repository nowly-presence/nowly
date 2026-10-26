# Account

Extension tokens, current profile, linked devices and account-level export/erasure. Sign-in is Better Auth (`features/auth/better-auth.ts`, Discord only).

## Guards

- `requireExtensionToken(scope)`: extension calls. Reads `Authorization: Bearer nxt_...`; unknown, revoked, expired or out-of-scope tokens get `401 UNAUTHORIZED`. Read the caller with `accountOf(request)`.
- `requireSession` (Better Auth cookie): nowly.me only, for destructive or sensitive routes (token issue, device unlink, `GET /me/export`, `DELETE /me`).
- `requireTokenOrSession`: routes both callers need (`/me`, `/me/devices`).
- Without `DATABASE_URL` every guard answers `503 DATABASE_UNAVAILABLE`; no account route runs unauthenticated.

## Tokens

- `nxt_` + 32 random bytes (base64url). Only the SHA-256 (`sha256Base64Url`) is stored in `ExtensionToken.tokenHash`; the raw token is returned once, with `expiresAt` in milliseconds.
- `POST /extension/tokens` revokes the previous tokens of the same user and device (10/min). Scopes come from `EXTENSION_TOKEN_SCOPES` in `@nowly/shared`; the extension only uses `sync`.
- Expiry is 90 days, sliding: `touchExtensionToken` extends `expiresAt`/`lastUsedAt` at most once an hour.

## Rules

- Take the user from `accountOf(request).userId`, never from the body.
- Any new per-user data must be added to `exportAccountData` and `deleteAccountData` (`account.service.ts`).
- Account deletion stays cookie-only: a leaked extension token must not erase an account.
- `apps/web`'s `/extension/connect` calls `POST /extension/tokens` with `credentials: "include"`; the cookie is shared on `.nowly.me`. Outside production `authTrustedOrigins()` adds `localhost:3000`.
