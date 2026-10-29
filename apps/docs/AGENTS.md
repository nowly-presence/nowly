<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Serving from nowly.me/docs

Docs can run as a Next.js multi-zone behind `apps/web`:

- Build docs with `NEXT_PUBLIC_DOCS_BASE_PATH=/docs` and `NEXT_PUBLIC_DOCS_BASE_URL=https://nowly.me/docs` (Dockerfile ARGs). `next.config.ts` then sets `basePath` and permanently redirects the `docs.nowly.me` host to `https://nowly.me/docs/...`.
- Build `apps/web` with `DOCS_ZONE_URL` (the internal address of this deployment, never `https://docs.nowly.me`) and the same `NEXT_PUBLIC_DOCS_BASE_URL`. Web rewrites `/docs` and `/docs/*` to it and its own proxy skips `/docs`.
- Without those variables docs live on docs.nowly.me and `nowly.me/docs` redirects there.
- Absolute URLs: `DOCS_URL` / `absoluteUrl` (`lib/constants.ts`, `features/seo/lib/seo.ts`). Root-relative `fetch`/asset paths Next does not prefix (search API, manifest): `DOCS_BASE_PATH`. `next/link`, next-intl `Link` and the proxy handle the base path themselves.
- `proxy.ts` keeps `"/"` in its matcher: under a base path the docs home reaches the proxy as an empty path.
