# About

`/about` (`components/about-view.tsx`). Until this page existed, `/about` redirected to `/` in `next.config.ts`; that redirect is gone.

- Text lives in the `aboutPage` namespace of `messages/*.json`, as `sections` (title and body, plain text) in all 11 locales. Keep the facts true: release dates come from `packages/changelog`, licenses from the repositories, the publisher from `legal.*`.
- The presence count in "Nowly in brief" comes from the catalog; the line is hidden when the API can't be reached.
- `TEAM` lists the maintainers shown with their GitHub avatar. Presence authors are credited on their own library pages, not here.
