<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Checks

`pnpm --filter @nowly/docs lint`. There is no typecheck script: run `npx tsc --noEmit` in `apps/docs`.

## Base path (nowly.me/docs)

- Docs can run as a multi-zone behind `apps/web`: build docs with `NEXT_PUBLIC_DOCS_BASE_PATH=/docs` and `NEXT_PUBLIC_DOCS_BASE_URL=https://nowly.me/docs`, and web with `DOCS_ZONE_URL` (the internal address, never `https://docs.nowly.me`) and the same `NEXT_PUBLIC_DOCS_BASE_URL`. Without them, docs live on docs.nowly.me.
- Absolute URLs use `DOCS_URL` / `absoluteUrl`. Root-relative `fetch` and asset paths that Next does not prefix (search API, manifest) must use `DOCS_BASE_PATH`. `next/link`, next-intl `Link` and the proxy handle the base path themselves.
- Keep `"/"` in the `proxy.ts` matcher: under a base path the docs home reaches the proxy as an empty path.
