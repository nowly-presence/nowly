# SEO

- Every page exports `generateMetadata` returning `createMetadata({ title, description, locale, path })` (`lib/seo.ts`): it appends `" | Nowly"` and builds canonical, hreflang and the OG image. Use `alternateLocales` / `canonicalLocale` for partially translated content and `noIndex` for pages that must never be indexed.
- Customize OG images with `accent`, `badge` and `logo` rather than a static `image`. Rendering and `OG_IMAGE_VERSION` live in `@nowly/og` (bump on design changes).
- JSON-LD: render with `<JsonLd data={...} />` (escapes `<`), never a hand-built script string; prefer `<WebPageJsonLd>` for whole pages.
- Previews get `noindex` automatically when `NEXT_PUBLIC_BASE_URL` is not nowly.me (`isSeoPreview`): never hardcode `noIndex` for that.
