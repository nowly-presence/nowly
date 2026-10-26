# SEO

`lib/seo.ts` builds the Next.js `Metadata` for docs pages.

## Add metadata to a page

Export `generateMetadata` calling `createMetadata({ title, description, locale, path, type?, image })`, with `locale` from `getLocale()` as `LocaleString`. `type` defaults to `"website"`.

Unlike `apps/web`, `createMetadata` does not generate an OG image when `image` is omitted (`openGraph.images`/`twitter.images` stay `undefined`). Always pass `image: docsOgImage(path, { title, description, category })`; doc pages use the wrapper in `features/docs-content/lib/og-metadata.ts`.

## Gotchas

- `OG_IMAGE_VERSION` is `"2"` here, versioned independently of web's (`"1"`). Bump it when changing `app/api/og/docs/[[...slug]]/route.tsx` rendering to bust CDN/browser caches.
