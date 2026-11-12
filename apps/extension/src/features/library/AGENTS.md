# Library

- Filtering and sorting stay pure in `library-catalog.ts`. New sort: `LibrarySort` and its comparator in `filterCatalog`, the option in `library-results-section.tsx`, a `library.sort*` key in every locale.
- The "New" sort and badge use the API's `addedAt` only, never install dates. The badge (`newPresenceSlugs`) is computed on the whole catalog and capped so a release batch never floods the list.
- Results are paginated at `LIBRARY_PAGE_SIZE` (20) by `paginate` in `library-catalog.ts`; the page lives in `library-results-section.tsx` and resets to 1 when query, category or sort changes. The trending carousel is not paginated; its Hide link sets `settings.showTrending = false`, re-enabled in Settings (not synced to the account).
- The end of the results and the empty search both open the presence creator (`{ name: "creator" }` route, `features/creator`).
