# SEO

`lib/seo.ts` builds the Next.js `Metadata` object for docs pages.

## Add SEO metadata to a new page/route

1. Export `generateMetadata` from the page:
   ```ts
   export const generateMetadata = async (): Promise<Metadata> => {
     const locale = await getLocale();
     return createMetadata({
       title: "Your Title",
       description: "Your description",
       locale: locale as LocaleString,
       path: "/your-path",
       type: "article", // "website" is the default
       image: docsOgImage("your-path", { title, description, category }),
     });
   };
   ```
2. Unlike `apps/web`'s `createMetadata`, this one does **not** auto-generate an OG image if `image` is omitted — `openGraph.images`/`twitter.images` are left `undefined` in that case. Always pass `image: docsOgImage(...)` explicitly (see `features/docs-content/lib/og-metadata.ts` for the wrapper actually used by doc pages).

## Gotchas
- `OG_IMAGE_VERSION` here is `"2"`, independently versioned from `apps/web`'s own `OG_IMAGE_VERSION` (`"1"`) — bump this one specifically if you change `app/api/og/docs/[[...slug]]/route.tsx`'s rendering, to bust any CDN/browser cache of the old images.

## Notable dependencies
`features/docs-content` (`og-metadata.ts` wraps `docsOgImage`), `lib/brand.ts`/`lib/constants.ts` (root).
