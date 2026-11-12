# Extension page

`/extension` shows the install link for the visitor's browser. `/extension/connect` is a temporary (non-permanent) redirect to `account.nowly.me/connect` in `next.config.ts`; the connect page lives in `apps/account`.

- New browser: widen `ExtensionBrowser` and `detectExtensionBrowser()` (`packages/env/src/extension-store.ts`, imported as `@nowly/env/client/extension-store`), add the store URL to `lib/constants.ts` and return it from `getExtensionDownloadUrl()`. Canary also needs a `zipUrl` entry (`features/canary`).
- `detectExtensionBrowser()` returns `"chrome"` during SSR: use it only on the client after hydration, never for server-rendered browser-specific links.
