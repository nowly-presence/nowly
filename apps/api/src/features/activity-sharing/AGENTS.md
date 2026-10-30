# Public custom activities

- `GET /activity-publications/:id` exposes only the opaque id, revision, validated portable activity and author name and avatar. Missing rows answer 404 `NOT_FOUND`, unpublished rows 404 `UNPUBLISHED`; outages answer 503 or another failure, never absence. Never reveal owner or account existence and never cache responses.
- Publisher routes (`/me/activity-publications/...`) require an extension token with explicit `creator` scope (`sync` alone is rejected) and a linked Discord account. The owner is only `accountOf(request).userId`. The native host's unsigned PONG profile is never authentication.
- Lifecycle: POST reserves a server-random id at revision 0 and never overwrites content; PUT only conditionally updates a matching reserved row (no create or upsert fallback); DELETE withdraws with a revision increment and keeps the id. An erased row must never be recreated by a delayed PUT.
- The 20-row quota per account (tombstones included) is checked after locking the owner row inside the transaction, and updates use a conditional revision write. Never replace this with a count outside the transaction.
- The strict schema rejects unknown or private fields, caller-supplied authors, detection URLs, local ids and runtime state. Embedded images: PNG, JPEG, WebP or GIF only (MIME and magic bytes), 1 MiB each, no SVG or HTML. The server never fetches user links.
- Publications cascade on account erasure and appear in the account export.
- Migrations are deployment work: never run them against a live database without explicit authorization.
