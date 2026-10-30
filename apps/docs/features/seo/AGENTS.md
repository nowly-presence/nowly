# SEO

- Pages export `generateMetadata` returning `createMetadata({ title, description, locale, path })` (`lib/seo.ts`). Pass `image: docsOgImage(path, { title, description, category })` to show the category badge.
- Doc pages pass `alternateLocales` from `getDocLocales` and the source locale as `canonicalLocale` when untranslated: only real translations go to hreflang and the sitemap.
- OG rendering and `OG_IMAGE_VERSION` come from `@nowly/og`; bump the version on design changes.
- Changelog pages canonicalize to nowly.me `/changelog` routes and stay out of the docs sitemap.
- Never invent `lastModified` dates; omit them without a reliable source.
