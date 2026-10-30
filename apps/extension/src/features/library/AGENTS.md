# Library

- Filtering and sorting stay pure in `library-catalog.ts`. New sort: `LibrarySort` and its comparator in `filterCatalog`, the option in `library-results-section.tsx`, a `library.sort*` key in every locale.
- The "New" sort and badge use the API's `addedAt` only, never install dates. The badge (`newPresenceSlugs`) is computed on the whole catalog and capped so a release batch never floods the list.
