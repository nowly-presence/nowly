# @nowly/og

Open Graph images for web and docs.

- The design, fonts, dimensions and cache headers live here (`src/image-response.tsx`). Apps keep thin route handlers that resolve their own metadata and call `createOgImageResponse`.
- `src/index.ts` must not import the server renderer.
- Bump `OG_IMAGE_VERSION` (`src/index.ts`) on every design change to invalidate image URLs in both apps.
- Keep app translations and routing out of this package.
