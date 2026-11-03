# Account (extension sign-in only)

`/extension/connect` stays here for extension builds that only trust the `nowly.me` origin. The account space itself moved to `apps/account` (account.nowly.me); `/account` redirects there. Remove this folder once every supported extension build opens `account.nowly.me/connect`.

- Same rules as before: no Better Auth client, API calls with `credentials: "include"` through `lib/account-api.ts`, `?permission=creator` never auto-connects, the extension works without an account.
- Admin scope (`?permission=admin`) exists only in `apps/account`.
