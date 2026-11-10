# Public profile

Opt-in public page shown on nowly.me at `/u/<handle>`, managed from the account space.

- Table `public_profiles` (one row per user, `enabled` false by default, cascade on account deletion, included in the account export). Handle rules and the reserved list are in `@nowly/shared` (`PUBLIC_HANDLE_PATTERN`, `isValidPublicHandle`; the reserved list is private to the module), the body schema in `@nowly/shared/schemas`.
- `GET` and `PUT /me/public-profile`: session cookie only, never an extension token. A taken handle answers `409 HANDLE_TAKEN`.
- `GET /users/:handle` is public and answers `404 PROFILE_NOT_FOUND` for an unknown handle and for a disabled profile alike. It returns only `handle`, `name`, `image`, `bio` and, when the owner enabled them, `created` (published creator presences) and `liked` (presences the account liked). Never add emails, Discord ids, devices, roles or activity. Handles are not listed or enumerable, and profiles stay out of the sitemap.
- The web page uses `revalidate` 60 seconds, so a disabled profile can stay visible for up to a minute.
