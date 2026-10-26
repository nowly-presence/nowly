# Extension

`app/[locale]/extension` renders `components/extension-view.tsx`: detects the visitor's browser and shows the matching install link. `app/[locale]/extension/connect` belongs to `features/account`.

## Add a supported browser (e.g. Edge, Brave)

1. Widen `ExtensionBrowser` in `lib/extension-store.ts` (shared with `canary`), currently `"chrome" | "firefox"`.
2. Add a branch in `detectExtensionBrowser()` (a `navigator.userAgent` regex, like the Firefox check).
3. Add the store URL to `lib/constants.ts` and return it from `getExtensionDownloadUrl()`.
4. `extension-view.tsx`, `canary-view.tsx` and `components/extension-store-button.tsx` all use these helpers; canary also has a per-browser `zipUrl` map to extend (see `features/canary`).

## Gotchas

- `detectExtensionBrowser()` returns `"chrome"` when `navigator` is undefined (SSR). Use it for client-side behavior after hydration, not for browser-specific server-rendered links.

## Notable dependencies
`lib/extension-store.ts`, `lib/constants.ts`, `components/extension-store-button.tsx`.
