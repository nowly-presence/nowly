# Docs Content

Rendering engine for docs pages (sidebar, search, TOC, MDX, prev/next). Used by `app/[locale]/(docs)/[...slug]/page.tsx` and, for the changelog, `app/[locale]/(docs)/changelog/page.tsx`.

## Add a page

Content lives in `content/docs/<N-category>/<M-page>/<locale>.mdx`, ordered by number prefix (`parseOrderedFolder`, `^(\d+)-(.+)$` in `lib/content.ts`).

1. Create `en-US.mdx` in the page folder; add other locales as translated. Missing locales fall back to `en-US` (`readDocFile`).
2. Pick `M` to sort among siblings (gaps are fine).
3. Frontmatter `title` and `description` are required: they drive the sidebar label, `<title>` and OG image.
4. No registration: `getDocsNav()` walks the filesystem.

## Add a category

1. Create `content/docs/<N-category>/` with a `_meta.json`: `{ "title": { "en-US": "...", "fr-FR": "..." } }`. Folders without it are skipped.
2. Add at least one page; empty categories are filtered out.

## Links in MDX

Write doc links root-relative without locale (`[Metadata](/presence-development/metadata)`); `mdx-components.tsx` renders them with next-intl's `Link` (locale prefix + base path). Paths listed in `WEBSITE_PATHS` (`/library...`) go to nowly.me. Other external links stay plain.

## Gotchas

- Duplicate heading ids: `extractTocItems` (`lib/types.ts`) disambiguates TOC keys, but `heading-anchor.tsx` computes DOM ids independently. Change heading-id logic in both or duplicate `id`s remain.
- Changelog is special-cased in `getDocContent`/`getNavigationItems` (`slug === "changelog"` / `startsWith("changelog/")`) and read from `@nowly/changelog`. `content/docs/changelog/<locale>.mdx` is only the intro page; releases live in `packages/changelog`.
