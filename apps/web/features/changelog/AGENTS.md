# Changelog

`app/[locale]/changelog` (list) and `app/[locale]/changelog/[version]` (one release) render content that lives in `packages/changelog`; this feature only displays it.

## Publish a release

1. Create `packages/changelog/content/<x-y-z>/` (dashes, e.g. `2-4-0/`).
2. Add one `.mdx` per locale: `en-US`, `fr-FR`, `de-DE`, `el-GR`, `es-ES`, `ja-JP`, `ko-KR`, `ms-MY`, `pl-PL`, `pt-BR`, `tr-TR`. Every existing release has all 11. The release date is read from the `en-US.mdx` frontmatter only (as `YYYY-MM-DD`); translated files' dates are ignored.
3. No registration in `apps/web`: `lib/changelog-releases.ts` (wrapping `@nowly/changelog`) picks it up, and `app/sitemap.ts` lists it on the next build.

## Behavior and gotchas

- `lib/changelog-releases.ts` is the only entry point into `@nowly/changelog` (`getChangelogReleases`, `getChangelogRelease`, `getChangelogNotes`, `latestReleaseSlugByStore`). Keep MDX parsing in the package and listing logic out of `changelog-view.tsx`.
- A release is hidden until its date is a valid `YYYY-MM-DD` that is not in the future (`isChangelogReleasePublished`); `date: null` counts as published. An unparseable date was once able to break `app/sitemap.ts`: check the date before publishing.
- `formatChangelogDate` lives in `lib/format-changelog-date.ts` (re-exported by `changelog-releases.ts`). Import it from the former in client or shared code: guides and presence pages use it too.
- `/changelog/<version>` renders the release body through `getChangelogNotes` and the Markdown engine of `features/content`. Only the Markdown subset renders (MDX components are skipped), so write plain Markdown. The docs "Full notes" link shows only when a release has no body.
- Store badges: only the latest release per store shows its badge (`latestReleaseSlugByStore`).

## Notable dependencies
`@nowly/changelog`, `features/content`, `app/sitemap.ts`.
