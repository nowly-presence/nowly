# About

`/about` (`components/about-view.tsx`).

- Text lives in the `aboutPage` namespace of `messages/*.json` (`sections`: title and plain-text body, all 11 locales). Keep facts true: release dates from `packages/changelog`, licenses from the repositories, publisher from `legal.*`.
- The presence count in the facts line comes from the library catalog; the line is hidden when the API can't be reached.
- `TEAM` lists the maintainers shown with their GitHub avatar. Presence authors are credited on their own library pages.
