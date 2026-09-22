# Support

Rendered by `app/[locale]/support`: `support-view.tsx` (help links), `contact-form.tsx` (posts to `apps/api`'s `contact` feature).

## Add a new support link (e.g. a new GitHub issue template)

1. Add the entry to `SUPPORT_LINKS` in `lib/support-links.ts`. For a GitHub issue-template link, use the existing `githubIssueUrl(repo, template)` helper rather than building the URL by hand.
2. Reference `SUPPORT_LINKS.yourKey` from `support-view.tsx`.
3. If it points at a new issue template file, that file must exist in the target repo's `.github/ISSUE_TEMPLATE/` (e.g. `nowly-presence/nowly` or `nowly-presence/presences`, see `PROJECT_REPOSITORY_URL`/`PRESENCES_REPOSITORY_URL` in `lib/constants.ts`) — this feature doesn't create it.

## Gotchas
- `githubIssueUrl` doesn't validate the template name — a typo silently produces a working-looking link that lands on GitHub's generic "no such template" state instead of erroring at build time. Double-check the template filename against the target repo.

## Notable dependencies
`contact` feature of `apps/api` (`POST /`, used by `contact-form.tsx`). `lib/constants.ts` (root, repo URLs).
