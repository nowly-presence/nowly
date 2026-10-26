# Canary

`app/[locale]/canary` renders `components/canary-view.tsx`: canary (dev) extension builds, per browser.

## Add a canary distribution channel

1. Zip URLs are `CANARY_EXTENSION_ZIP_URL` / `CANARY_FIREFOX_ZIP_URL` in `lib/constants.ts`, mapped per browser by `zipUrl` in `canary-view.tsx`. Add the new URL there.
2. For a new browser, first follow the `extension` feature's "Add a new supported browser" steps (`lib/extension-store.ts` is shared).
3. Reuse `CANARY_ACCENT` / `CANARY_INK` and `BRAND_LOCKUP_CANARY` from `lib/brand.ts` rather than hardcoding colors.

## Gotchas

- The canary look of the store button is route-driven: `navbar.tsx` computes `canary = pathname === "/canary"`, applies the accent/ink styling to `ExtensionStoreButton`, and passes `canary` to `mobile-nav.tsx`, which applies the same styling. Another route with a distinct navbar look must update both files; nothing is themed from this feature.

## Notable dependencies
`lib/extension-store.ts`, `lib/brand.ts`, `lib/constants.ts` (root, shared).
