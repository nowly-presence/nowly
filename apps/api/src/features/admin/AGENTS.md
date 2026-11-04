# Admin

Roles, capabilities and the admin audit log. The server decides everything: the extension and nowly.me only display what the API grants.

- Roles and capabilities live in `@nowly/shared/roles` (`USER_ROLES`, `ROLE_CAPABILITIES`). Roles, from least to most trusted: `user` (nothing), `moderator` (`review` only: approves or requests changes, never publishes, announces or manages roles), `admin` (`review`, `publish`, `announce`, `manage`). Publishing stays an admin task. `capabilitiesOf` returns nothing for an unknown role: never default to a privilege.
- Admin routes use `requireCapability(capability)` (`admin.middleware.ts`). It re-reads `users.role` from the database on every request; never trust a role carried by a token, a cookie, a local flag or the request body. Extension tokens also need the `admin` scope (`403 ADMIN_SCOPE_REQUIRED`); a site session does not.
- The `admin` scope is minted only for an account whose role has capabilities (`403 ADMIN_REQUIRED`). `setUserRole` revokes every live `admin`-scoped token of the user on any role change, in the same transaction.
- The shared secret (`API_SECRET_KEY`) stays only for CI and scripts: `requireSecretOrCapability` accepts it and records the action with `actorKind: "secret"`.
- Every admin write records `recordAdminAction(tx, actor, entry)` inside the same transaction as the write. A new action goes in `AuditAction`. Never put activity content, tokens or emails in `details`.
- Audit rows keep `actor_id` set to `null` when the actor erases their account, and appear in the account export (`adminActions`).
- Bootstrapping the first admin: `pnpm --filter @nowly/api role:set <user id or email> admin` (needs `DATABASE_URL`, audited as `cli`). A user cannot change their own role through the API.
- Presence moderation (`publish` capability, so admins only): `PUT /admin/presences/:slug/hidden` toggles `presences.archived`, `GET /admin/presences/hidden` lists hidden ones, `DELETE /admin/presences/:slug` erases the catalog row, creator rows, submissions, likes, installs and R2 objects (`presences/<slug>/`, submission images). It never touches the presences repository: the folder must be removed there too or a later publication brings the presence back. Each action is audited (`presence.hide`, `presence.show`, `presence.delete`).
