# Canary

Rendered by `app/[locale]/canary`: `canary-view.tsx` shows canary (dev) extension builds.

## Add a new canary distribution channel

1. Same underlying helpers as the `extension` feature: `lib/extension-store.ts` and `lib/brand.ts` (both root, shared between `canary` and `extension`).
2. If it's a new browser, follow the `extension` feature's "Add a new supported browser" steps first.
3. `canary-view.tsx` uses `CANARY_ACCENT`/`CANARY_INK` (from `lib/brand.ts`) for its distinct styling — reuse those constants rather than hardcoding new colors, since `navbar.tsx` also reads them to re-skin the extension-store button when the visitor is on `/canary`.

## Gotchas
- The canary/extension visual distinction (accent color) is driven by the route (`pathname === "/canary"` in `navbar.tsx`), not by a prop passed down from this feature — don't try to theme the navbar from here.

## Notable dependencies
`lib/extension-store.ts`, `lib/brand.ts`, `lib/constants.ts` (root, shared).
