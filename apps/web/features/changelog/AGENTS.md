# Changelog

Displays releases from `packages/changelog`; content never lives here.

- New release: `packages/changelog/content/<x-y-z>/` with one `.mdx` per locale (all 11). Only the `en-US.mdx` frontmatter date (`YYYY-MM-DD`) counts; a future date keeps the release hidden. An unparseable date can break `app/sitemap.ts`: check it. Nothing to register.
- `lib/changelog-releases.ts` is the only entry point into `@nowly/changelog`: keep MDX parsing in the package and listing logic out of `changelog-view.tsx`.
- Import `formatChangelogDate` from `lib/format-changelog-date.ts` in client or shared code.
- Release bodies render with the `features/content` Markdown subset: write plain Markdown; MDX components are skipped.
