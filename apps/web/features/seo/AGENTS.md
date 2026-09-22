# SEO

`lib/seo.ts` builds the Next.js `Metadata` object used by nearly every page. `json-ld.tsx`/`web-page-json-ld.tsx` render structured data.

## Add SEO metadata to a new page

1. In the page's `page.tsx` (or `metadata.ts` if the route splits it out), export `generateMetadata`:
   ```ts
   export const generateMetadata = async (): Promise<Metadata> => {
     const locale = await getLocale();
     const t = await getTranslations("yourNamespace");
     return createMetadata({
       title: t("title"),
       description: t("description"),
       locale,
       path: "/your-path",
     });
   };
   ```
2. `createMetadata` (in `lib/seo.ts`) automatically: appends `" | Nowly"` to the title if not already present, builds the `hreflang` alternates for all 11 locales via `getPathname`/`routing.locales`, and generates an OG image by calling `/api/og` with the title/description as query params.
3. To use a custom OG image instead of the auto-generated one, pass `image: "/some/static/path.png"` (or a full URL) in the options object.

## Add a JSON-LD block to a page

1. Build a plain object shaped like a schema.org type (see `organizationJsonLd()` in `lib/seo.ts` for the pattern: a `Record<string, unknown>` with `@type`/`@id`).
2. Render it with `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />` — `jsonLd()` escapes `<` to prevent breaking out of the script tag, never build that string manually.
3. For a full page's structured data, prefer composing with `<WebPageJsonLd>` (`web-page-json-ld.tsx`) rather than writing a new `<script>` tag inline.

## Gotchas

- `ogHeadline()` strips a leading/trailing `"Nowly |"` from the title before using it as the OG image's giant on-image headline — the page `<title>` still shows the full `"X | Nowly"` string, only the rendered OG image text is stripped. If OG images look wrong for a new page, check this function isn't being bypassed.
- `isSeoPreview` hides pages from indexing (`noindex`) whenever `NEXT_PUBLIC_BASE_URL` doesn't resolve to `nowly.me`/`www.nowly.me` — this is what keeps preview/staging deploys out of Google. Don't hardcode `noIndex: true` per-page to achieve the same thing.

## Notable dependencies
Used by every other page feature (`home`, `library`, `legal`, `changelog`, etc.), `lib/brand.ts` and `lib/constants.ts` (root), `app/api/og/route.tsx` (renders the actual OG image from the query params `webOgImage()` builds).
