# Changelog

Rendered by `app/[locale]/changelog` (list) and `app/[locale]/changelog/[version]` (one release).

## Publish a new release

The actual content lives in `packages/changelog/content/<version>/`, not in this feature — this folder only renders it:

1. Create `packages/changelog/content/<x-y-z>/` (dashes, not dots — e.g. `1-3-0/`).
2. Add one `.mdx` file per locale inside it: `en-US.mdx`, `fr-FR.mdx`, `de-DE.mdx`, `el-GR.mdx`, `es-ES.mdx`, `ja-JP.mdx`, `ko-KR.mdx`, `ms-MY.mdx`, `pl-PL.mdx`, `pt-BR.mdx`, `tr-TR.mdx` — every existing release has all 11, don't skip locales.
3. `getChangelogList`/`getChangelogEntry` (from `@nowly/changelog`, wrapped here by `lib/changelog-releases.ts`) pick this up automatically — no registration step in `apps/web`.
4. `app/sitemap.ts` also calls into `lib/changelog-releases.ts` to list version URLs — a new release shows up there on the next build with no extra step, *provided* the release date parses (see Gotchas).

## Gotchas

- `formatChangelogDate` in `lib/changelog-releases.ts` expects a strict `YYYY-MM-DD` date string; an unparseable date has crashed `app/sitemap.ts`'s build once before. Double check the date in the release's frontmatter/metadata (inside `packages/changelog`) before publishing.
- Don't add release-listing logic to `changelog-view.tsx` — `getChangelogReleases`/`getChangelogRelease` in `lib/changelog-releases.ts` are the only entry points into `@nowly/changelog`; keep the MDX-parsing details in that package.

## Notable dependencies
`@nowly/changelog` (content package, `packages/changelog`), `app/sitemap.ts` (root, depends on this feature's `lib/changelog-releases.ts`).
