# Extension page

`/extension` shows the install link for the visitor's browser (`/extension/connect` belongs to `features/account`).

- New browser: widen `ExtensionBrowser` and `detectExtensionBrowser()` (`lib/extension-store.ts`), add the store URL to `lib/constants.ts` and return it from `getExtensionDownloadUrl()`. Canary also needs a `zipUrl` entry (`features/canary`).
- `detectExtensionBrowser()` returns `"chrome"` during SSR: use it only on the client after hydration, never for server-rendered browser-specific links.
