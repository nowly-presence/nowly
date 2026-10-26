# Support

`app/[locale]/support` is the single help and contact page (no `/contact`): `support-view.tsx` (help link lists, form column, publisher line), `contact-form.tsx` (`POST /contact` on the API's `contact` feature, anchor `#contact`), `donate-card.tsx` (Ko-fi and GitHub Sponsors, anchor `#donate`).

Redirects in `next.config.ts` send `/redem` and `/support/redeem` to `/support` (the old donation-reward flow is gone). `app/[locale]/redeem` is a `notFound()` placeholder.

## Add a support link (e.g. a GitHub issue template)

1. Add the entry to `SUPPORT_LINKS` in `lib/support-links.ts`; for issue templates use `githubIssueUrl(repo, template)`.
2. Reference `SUPPORT_LINKS.yourKey` in `support-view.tsx`.
3. The template file must already exist in the target repo's `.github/ISSUE_TEMPLATE/` (`PROJECT_REPOSITORY_URL` or `PRESENCES_REPOSITORY_URL` in `lib/constants.ts`).

## Gotchas

- `#donate` and `#contact` are public anchors: the extension's support card and the home community section link to `/support#donate`; the footer's "Contact" and the About page link to `/support#contact`. Keep both ids when reworking the page.
- The form uses `presenceApiBaseUrl()` (`lib/presence-api-client.ts`, `NEXT_PUBLIC_API_BASE_URL`). Delivery (Amazon SES) is configured in `apps/api/src/features/contact`.
- `githubIssueUrl` doesn't validate the template name: a typo yields a working-looking link to GitHub's generic page. Check the filename.

## Notable dependencies
`contact` feature of `apps/api`, `lib/constants.ts` (repo, Ko-fi, Sponsors URLs).
