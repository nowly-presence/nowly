# Library

Catalog browsing: search, category chips, trending carousel, sortable results with install.

## Add a sort

1. Add the value to `LibrarySort` and its comparator in `filterCatalog` (`library-catalog.ts`).
2. Add the option to the `Segmented` in `library-results-section.tsx` and its `library.sort*` key to every `messages/*.json`.

## Gotchas

- Filtering and sorting are pure functions in `library-catalog.ts`; keep them out of components so they stay testable.
- "New" sorts by `addedAt` (first publication), unknown dates last; the "New" badge (`newPresenceSlugs`, computed on the whole catalog, not the filtered results) marks the latest publication days within 14 days, adding whole days while the total stays at 5 or fewer, so a release batch (e.g. 24 presences published the same day) never floods the list. Both use API dates only (see root AGENTS.md), never the local install date.
- Category and sort live in component state; the layer system keeps the view mounted, so they survive opening a presence and coming back.

## Notable dependencies
`FETCH_PRESENCE_CATALOG` (via `refresh.catalog`), `hooks/use-presence-actions` (install), `lib/presence-view` (catalog item -> view model).
