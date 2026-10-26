# Library

Presence library: listing (`app/[locale]/library`), presence page (`app/[locale]/library/[slug]`), author page (`app/[locale]/author/[github]`).

## Add a presence category

Categories live in two places that must stay in sync:

1. Add the value to `LIBRARY_CATEGORIES` in `lib/library-catalog.ts` (root; backs the library UI).
2. Add it to the `category` enum in `packages/presences/metadata.schema.json` (validated against `Metadata` in `packages/sdk/src/metadata.ts`). A presence with a category missing from `LIBRARY_CATEGORIES` still validates at publish time but gets no filter/section in the UI.
3. Add the translated label to the namespace read by `library-view.tsx` / `paginated-library-grid.tsx`.

## Add a presence action (like "report"/"like")

1. Put the trigger in `presence-actions.tsx`, not `presence-view.tsx`.
2. For a dialog, follow `presence-report-dialog.tsx` (controlled dialog taking the presence slug).
3. Don't call `fetch` inline against a hardcoded URL. Two API helpers exist:
   - `lib/presence-api-client.ts`: client-safe (`presenceApiBaseUrl()` from `NEXT_PUBLIC_API_BASE_URL`, logo/thumbnail CDN URLs). Use it from client components, as `presence-like-button.tsx` does.
   - `lib/presence-api.ts`: `server-only` (catalog, stats, version notes; base URL also honors `PRESENCE_API_URL`). Importing it from a client component breaks the build; type-only imports are fine.

## Gotchas

- `LocalizedCopy`/`LocalizedList` in `library-catalog.ts` cover the 11 locales. Metadata may omit translations; `localizedDescription`/`localizedFeatures` then fall back to the default locale.
- `presenceSearchText` indexes every localized description and long description from the API, so translated copy is searchable.

## Presence guides and indexing

- No presence guide is published while `content/presences` is absent. To republish the archived ones, copy `presence-guides-backup/apps/web/content/presences` into `apps/web/content/`: `getPresenceGuide` (`lib/presence-guide.ts`) then loads `<slug>/<locale>.md` and `presence-view.tsx` shows them folded in `ExpandableContent`.
- `LibraryPresence.locales` lists the locales a presence ships a description for. `presenceIndexLocales` adds locales with a translated description or a published guide to hreflang and the sitemap; other locales canonicalize to English.
- Presence pages and the library listing have no ad placements (ads are guides only).

## Notable dependencies
`lib/library-catalog.ts`, `lib/presence-api.ts`, `lib/presence-api-client.ts`, `lib/analytics.ts`, `components/extension-store-button.tsx`, `components/presence-tile.tsx`, `presence` feature of `apps/api`.
