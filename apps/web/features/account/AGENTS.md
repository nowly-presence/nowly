# Account (extension sign-in only)

`/extension/connect` stays here for extension builds that only trust the `nowly.me` origin. When the extension reports a version of 2.6.0 or more (`GET_DIAGNOSTIC`, `extensionVersion`), the page hands over to `account.nowly.me/connect` with `location.replace` (never a permanent redirect, query kept); older builds keep this flow. The account space itself moved to `apps/account` (account.nowly.me); `/account` redirects there. Remove this folder once every supported extension build opens `account.nowly.me/connect`.

- Same rules as before: no Better Auth client, API calls with `credentials: "include"` through `lib/account-api.ts`, `?permission=creator` never auto-connects, the extension works without an account.
- Admin scope (`?permission=admin`) exists only in `apps/account`.
