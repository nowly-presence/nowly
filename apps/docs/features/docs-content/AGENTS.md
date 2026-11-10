# Docs content

- Pages: `content/docs/<N-category>/<M-page>/<locale>.mdx`, ordered by number prefix (gaps are fine). `en-US.mdx` is required; other locales fall back to it. Frontmatter `title` and `description` are required (sidebar, `<title>`, OG image). Nothing to register: navigation walks the filesystem.
- Categories need a `_meta.json` (`{ "title": { "en-US": "..." } }`) and at least one page, otherwise they are skipped.
- Links: write doc links root-relative without locale (`/presence-development/metadata`); they get the locale and base path. Paths in `WEBSITE_PATHS` go to nowly.me.
- Heading IDs and table-of-contents entries come from the same MDX compiler pass in `lib/mdx-headings.ts`. Keep existing IDs stable for inbound links.
- The changelog is special-cased (`slug === "changelog"`): releases come from `packages/changelog`; `content/docs/changelog/<locale>.mdx` is only the intro.
