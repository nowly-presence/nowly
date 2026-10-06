# Library

The presence library: listing (`app/[locale]/library`), presence page (`app/[locale]/library/[slug]`), author page (`app/[locale]/author/[github]`).

## Add a new presence category

Categories are duplicated in two places that must stay in sync:

1. Add the new value to `LIBRARY_CATEGORIES` in `apps/web/lib/library-catalog.ts` (root — this file backs the library UI, not this feature folder).
2. Add the matching value to the `category` enum in the presence metadata schema (`packages/presences/metadata.schema.json`, validated against `Metadata` in `packages/sdk/src/metadata.ts`) — a presence declaring a category not in `LIBRARY_CATEGORIES` will still validate at publish time but won't get its own filter/section in the library UI.
3. Add the category's translated label to whichever namespace `features/library/components/library-view.tsx`/`paginated-library-grid.tsx` reads category labels from.

## Add a new presence action (like current "report"/"like")

1. Add the UI trigger inside `presence-actions.tsx`, not `presence-view.tsx` — that's the single place presence-level actions are assembled.
2. If it needs a dialog, follow `presence-report-dialog.tsx`'s pattern (a controlled dialog component taking the presence slug as a prop).
3. Wire the actual request through `lib/presence-api.ts` (root, shared) rather than calling `fetch` inline — it already knows the API base URL and the `presence` feature's endpoints on `apps/api`.

## Gotchas

- `LocalizedCopy`/`LocalizedList` in `library-catalog.ts` cover all 11 supported locales. Presence metadata may still omit translations, so `localizedDescription`/`localizedFeatures` fall back to the shared default locale.
- `presenceSearchText` indexes every localized description and long description returned by the API, so translated copy remains searchable.

## Notable dependencies
`lib/library-catalog.ts`, `lib/analytics.ts`, `lib/presence-api.ts` (root, shared), `components/extension-store-button.tsx`, `components/presence-tile.tsx`, `presence` feature of `apps/api`.
