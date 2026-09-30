<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Activity icon image route

The public extension image contract is:

`/api/activity-icon/<icon>/<color>.png?v=1`

The route accepts only the keys and colors exported from `app/api/activity-icon/activity-icons.ts`. The `v` query parameter is a cache-busting render version and must remain synchronized with the extension's `CUSTOM_ICON_RENDER_VERSION`; it does not affect validation or drawing. Keep the icon keys and color palette synchronized with `CUSTOM_ACTIVITY_ICONS` and `CUSTOM_ACTIVITY_COLORS` in the extension.
