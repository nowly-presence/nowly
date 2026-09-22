# Docs Content

The documentation rendering engine: sidebar, search, table of contents, MDX rendering, page navigation. Consumed by `app/[locale]/(docs)/[...slug]/page.tsx` (a docs page) and `app/[locale]/(docs)/changelog/page.tsx` (which reuses this same engine, not a separate feature).

## Add a new documentation page

Content lives under `content/docs/<N-category>/<M-page>/`, ordered by number prefix (see `parseOrderedFolder` in `lib/content.ts` — it matches `^(\d+)-(.+)$`, e.g. `1-getting-started`):

1. To add a page to an existing category, create `content/docs/<N-category>/<M-page-slug>/en-US.mdx` (and one file per other locale you're ready to translate — missing locales fall back to `en-US.mdx` automatically, see `readDocFile` in `lib/content.ts`).
2. `M` controls ordering among sibling pages in that category — pick a number that sorts where you want it (gaps are fine, e.g. `5`, `10`, `15`).
3. Frontmatter fields read by the app: `title` and `description` (via `gray-matter`, parsed in `getDocContent`/`getNavigationItems`) — add both, they drive the sidebar label, the page `<title>`, and the OG image.
4. No sidebar registration step: `getDocsNav()` walks the filesystem on every call, so a new folder shows up automatically as long as it's numbered correctly.

## Add a new documentation category

1. Create `content/docs/<N-category-slug>/`.
2. Add a `_meta.json` inside it: `{ "title": { "en-US": "Your Category", "fr-FR": "..." } }` — `getDocsNav()` skips any folder without a `_meta.json` (see the `.filter((category) => existsSync(...))` in `lib/content.ts`), so this file is required, not optional.
3. Add at least one page inside it (an empty category is filtered out — see the last `.filter((category) => category.children.length > 0)` in `getDocsNav()`).

## Gotchas

- Known duplicate-id gap: `extractTocItems` (`lib/types.ts`) disambiguates repeated/empty heading text for the table of contents' React keys, but `heading-anchor.tsx` computes each heading's DOM `id` independently and isn't synced with that disambiguation. If you touch heading-id generation, check both files — otherwise two headings with the same text can still end up with duplicate `id` attributes in the rendered DOM even though the TOC list itself no longer warns about duplicate keys.
- The changelog route (`app/[locale]/(docs)/changelog`) is handled specially inside `getDocContent`/`getNavigationItems` (branches on `slug === "changelog"` / `slug.startsWith("changelog/")`) and reads from `@nowly/changelog`, not from `content/docs/changelog/**` — that folder only holds the changelog's own intro page (`content/docs/changelog/<locale>.mdx`), not per-version content. To publish a new release, see `packages/changelog`'s content folder, not this feature.

## Notable dependencies
`next-mdx-remote`, `gray-matter`, `@nowly/changelog` (changelog integration), `features/seo` (metadata), `@nowly/ui`.
