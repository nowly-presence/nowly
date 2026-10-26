# Guides

`/guides` (`components/guides-view.tsx`) and `/guides/<slug>` (`components/guide-view.tsx`), written in `content/guides/<slug>/<locale>.md`. Markdown rules are in `features/content/AGENTS.md`.

## Add a guide

1. Create `content/guides/<slug>/en-US.md` (required) and `fr-FR.md`. The slug is the URL: lowercase, digits, dashes.
2. Frontmatter: `title`, `description` (also the meta description), `category` (one of `GUIDE_CATEGORIES` in `lib/guides.ts`), `order` (position in its category), `updated` (YYYY-MM-DD), `related` (comma-separated slugs, shown first under "Keep reading").
3. Nothing to register: the index, sitemap and `llms.txt` list every folder with at least one `.md`.

## Locales

A guide exists in the locales that have a file. Other locales show the English text with a notice (`guidesPage.fallback`), a canonical URL pointing to the English page, hreflang limited to real translations, and no sitemap entry. Add a translation by adding the file.

## Ads

`app/[locale]/guides/[slug]/page.tsx` passes `<AdSlot placement="guides" />` as `beforeRelated` to `GuideView`, between the article and "Keep reading". It renders nothing until AdSense is enabled (see `features/ads/AGENTS.md`).
