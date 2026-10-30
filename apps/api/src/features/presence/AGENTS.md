# Presence

- `getPresenceListData` must stay a fixed number of bulk queries (`findMany` and `groupBy`): never query per slug inside it (that N+1 degraded the `library` status check). Add a list stat as another bulk query merged by slug. Single-slug routes are a separate code path.
- Archived presences answer `404 PRESENCE_NOT_FOUND` unless the request has admin access (`hasAdminAuth`).
- Never change the canonical JSON or signed release payload fields (`buildRelease`) without coordinating with the extension verifier.
- Publishing (`PUT /:slug`, `POST /sync`, both `requireAuth`): `addedAt` and `updatedAt` come from the release, never from "now".
- `metadata.aliases` are resolved only by the website; API routes use the canonical slug. `POST /sync` rejects the whole batch (`400 PRESENCE_ALIAS_CONFLICT`) before any write when an alias is invalid or already used by another non-archived presence (`getPresenceAliasIssues`, `@nowly/shared`).
