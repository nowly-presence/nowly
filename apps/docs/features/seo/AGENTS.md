# SEO

`lib/seo.ts` builds the Next.js `Metadata` for docs pages.

## Add metadata to a page

Export `generateMetadata` calling `createMetadata({ title, description, locale, path, type?, image })`, with `locale` from `getLocale()` as `LocaleString`. `type` defaults to `"website"`.

`createMetadata` generates an OG image by default. Pass `image: docsOgImage(path, { title, description, category })` to include the localized category badge.

Doc pages pass `alternateLocales` from `getDocLocales` and use the source locale as `canonicalLocale` when a translation is missing. Only actual translations belong in hreflang and the sitemap. `DocJsonLd` adds TechArticle and BreadcrumbList structured data to documentation pages.

## Gotchas

- Rendering and `OG_IMAGE_VERSION` are shared with web through `@nowly/og`. Bump the version in `packages/og/src/index.ts` when changing the shared design. Docs categories are rendered as badges; the legacy `category` query parameter remains supported.
- Changelog pages canonicalize to the marketing site's `/changelog` and `/changelog/<dotted-version>` routes and are excluded from the docs sitemap. Do not invent `lastModified` timestamps for documentation; omit them unless reliable modification dates are available.
