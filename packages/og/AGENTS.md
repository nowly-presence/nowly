# @nowly/og

Shared Open Graph image system for web and docs. `src/image-response.tsx` owns the design, Satoshi font loading, brand lockup, dimensions and cache headers. Both apps keep thin Node.js route handlers that resolve their own metadata and call `createOgImageResponse`.

`src/index.ts` exposes the URL builder and `OG_IMAGE_VERSION` without importing the server renderer. Bump this shared version when changing the design to invalidate image URLs in both apps. Keep app-specific translations and routing out of this package.
