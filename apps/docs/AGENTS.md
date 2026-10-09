<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Serving the docs from nowly.me/docs

The docs can run under a base path, as a Next.js multi-zone behind `apps/web`:

- Build this app with `NEXT_PUBLIC_DOCS_BASE_PATH=/docs` and `NEXT_PUBLIC_DOCS_BASE_URL=https://nowly.me/docs` (Dockerfile ARGs). `next.config.ts` then sets `basePath`, and requests on the `docs.nowly.me` host get a permanent redirect to `https://nowly.me/docs/...` (`basePath: false`).
- Build `apps/web` with `DOCS_ZONE_URL` (the internal address of this deployment, never `https://docs.nowly.me`, which now redirects) and the same `NEXT_PUBLIC_DOCS_BASE_URL`. `apps/web` proxies `/docs` and `/docs/*` to it (`beforeFiles` rewrites) and its own proxy skips `/docs`.
- Without those variables both apps behave as before: docs on docs.nowly.me, `nowly.me/docs` redirecting there.
- Use `DOCS_URL`/`absoluteUrl` (`lib/constants.ts`, `features/seo/lib/seo.ts`) for absolute URLs and `DOCS_BASE_PATH` for root-relative `fetch` or asset paths that Next does not prefix by itself (the search API call, the manifest). `next/link`, next-intl's `Link` and the proxy handle the base path on their own.
- `proxy.ts` lists `"/"` in its matcher: under a base path the docs home reaches the proxy as an empty path.
