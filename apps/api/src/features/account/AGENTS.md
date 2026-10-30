# Account

Extension tokens, profile, linked devices and the account GDPR routes. Sign-in is Better Auth (Discord only, `features/auth`).

- Guards: `requireExtensionToken(scope)` for extension calls, `requireSession` for nowly.me-only sensitive or destructive routes, `requireTokenOrSession` when both callers need it. Account deletion, export and device unlinking stay cookie-only so a leaked token cannot use them.
- Read the user with `accountOf(request).userId`, never from the body.
- Guards answer `503 DATABASE_UNAVAILABLE` without `DATABASE_URL`: no account route may ever run unauthenticated.
- Tokens: `nxt_` plus 32 random bytes; store only the SHA-256 (`tokenHash`) and return the raw token once. 90-day sliding expiry (`touchExtensionToken`, at most hourly). Scopes come from `EXTENSION_TOKEN_SCOPES` (`@nowly/shared`): the normal connect is `sync` only, `creator` is granted explicitly by the website.
- New per-user data must be added to `exportAccountData` and `deleteAccountData` (`account.service.ts`).
