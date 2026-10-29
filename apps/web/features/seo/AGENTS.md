# SEO

`lib/seo.ts` builds the Next.js `Metadata` used by nearly every page. `components/json-ld.tsx` and `components/web-page-json-ld.tsx` render structured data.

## Add metadata to a page

Export `generateMetadata` from the page (or its `metadata.ts`):

```ts
export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getLocale();
  const t = await getTranslations("yourNamespace");
  return createMetadata({ title: t("title"), description: t("description"), locale, path: "/your-path" });
};
```

`createMetadata` appends `" | Nowly"` to the title unless it already contains "Nowly"; builds canonical and `hreflang` alternates (plus `x-default`) on the production origin from `routing.locales` via `getPathname`; and sets an OG image from `/api/og` with title/description as query params (`webOgImage`, versioned by `OG_IMAGE_VERSION`). Options worth knowing:

- `image`: static path or full URL replacing the generated OG image.
- `alternateLocales` limits hreflang entries; `canonicalLocale` points the canonical at another locale (used for untranslated content, see `features/guides`, `features/library`).
- `noIndex`: for pages that must never be indexed (account, connect).

## Add JSON-LD

1. Build a plain `Record<string, unknown>` with `@type`/`@id` (pattern: `organizationJsonLd()`).
2. Render it with `<JsonLd data={...} />`, which uses `jsonLd()` to escape `<`. Never build the script string by hand.
3. For a whole page prefer `<WebPageJsonLd name description path crumbs? />`, which includes the organization and breadcrumbs.

## Gotchas

- `ogHeadline()` strips a leading or trailing "Nowly |" only from the OG image headline; the `<title>` keeps the full string. If an OG image looks wrong, check it isn't bypassed.
- The renderer, URL builder and `OG_IMAGE_VERSION` live in `@nowly/og`, shared with docs. Bump the version in `packages/og/src/index.ts` when changing the design. Use `accent`/`badge`/`logo` rather than a static `image` override to customize a page.
- The OG image URL resolves on the host serving the page (so crawlers work on previews), while canonical/alternate URLs always use `https://nowly.me`.
- `isSeoPreview` forces `noindex` whenever `NEXT_PUBLIC_BASE_URL` isn't `nowly.me`/`www.nowly.me`, keeping previews out of Google. Don't hardcode `noIndex` for that.

## Notable dependencies
`lib/brand.ts`, `lib/constants.ts`, `app/api/og/route.tsx` (renders the image from `webOgImage()` params). Used by every page feature.
