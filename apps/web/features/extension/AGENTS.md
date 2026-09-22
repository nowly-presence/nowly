# Extension

Rendered by `app/[locale]/extension`: `extension-view.tsx` detects the visitor's browser and shows the right install link.

## Add a new supported browser (e.g. Edge, Brave)

1. Widen `ExtensionBrowser` in `apps/web/lib/extension-store.ts` (root, shared with `canary`) — currently `"chrome" | "firefox"`.
2. Add a detection branch in `detectExtensionBrowser()` (a `navigator.userAgent` regex test, same pattern as the existing Firefox check).
3. Add the new store URL as a constant in `lib/constants.ts` and reference it from `getExtensionDownloadUrl()`.
4. `extension-view.tsx` and `components/extension-store-button.tsx` (root, used by 6+ places across the app) both call `getExtensionDownloadUrl`/`detectExtensionBrowser` — adding the browser here is enough, no per-caller change needed.

## Gotchas
- `detectExtensionBrowser()` defaults to `"chrome"` when `navigator` is undefined (SSR) — don't rely on it for a browser-specific server-rendered link, only for client-side behavior after hydration.

## Notable dependencies
`lib/extension-store.ts`, `lib/constants.ts`, `components/extension-store-button.tsx` (root, shared).
