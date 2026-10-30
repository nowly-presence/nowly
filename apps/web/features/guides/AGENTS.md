# Guides

`/guides` and `/guides/<slug>`. Markdown rules: `features/content/AGENTS.md`.

- New guide: `content/guides/<slug>/en-US.md` (required) and `fr-FR.md`; the slug (lowercase, digits, dashes) is the URL. Frontmatter: `title`, `description`, `category` (from `GUIDE_CATEGORIES` in `lib/guides.ts`), `order`, `updated` (`YYYY-MM-DD`), `related` (comma-separated slugs). Nothing to register.
- Untranslated locales show English with a notice, a canonical to the English page, no hreflang and no sitemap entry. Translate by adding the file.
- Guide articles are the only ad placement (see `features/ads/AGENTS.md`).
