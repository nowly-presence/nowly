<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Checks

- `pnpm --filter @nowly/web lint`; tests: `pnpm --filter @nowly/web exec vitest run`. There is no typecheck script: run `npx tsc --noEmit` in `apps/web`.
- Local dev: bind `localhost`, never `127.0.0.1` (next-intl's localhost rewrite then loops on every page): `pnpm --filter @nowly/web exec next dev --hostname localhost --port 3000`.

## Activity icon route

`/api/activity-icon/<icon>/<color>.png?v=1` is a public contract with the extension. Keys and colors come from `app/api/activity-icon/activity-icons.ts` and must match the extension's `CUSTOM_ACTIVITY_ICONS` and `CUSTOM_ACTIVITY_COLORS`; `v` must match its `CUSTOM_ICON_RENDER_VERSION`.
