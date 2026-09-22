# Layout

The dashboard's shell, mounted in `app/(dashboard)/layout.tsx`: `dashboard-shell.tsx` (frames every page, hosts the `features/chat` panel trigger), `app-sidebar.tsx` (navigation + campaign/environment switcher), `dev-tools.tsx` (dev-only debug panel).

## Add a navigation item to the sidebar

1. Open `features/layout/components/app-sidebar.tsx`.
2. If it's a link to a default view, it's already covered — `app-sidebar.tsx` reads `DEFAULT_VIEW_SLUGS`/`DEFAULT_VIEW_LABELS` from `features/views/lib/default-views.ts` automatically (see that feature's `AGENTS.md` to add a new default view).
3. For anything else (a static link, a new top-level page), add the entry directly in `app-sidebar.tsx`'s nav item list.

## Gotchas
- `dev-tools.tsx` is meant to stay dev-only — check how it currently gates itself (env check) before adding a new debug affordance, rather than introducing a second gating mechanism.

## Notable dependencies
`features/views` (default views list), `features/chat` (panel open/close state via `use-chat-panel.ts`), `features/api-target` (environment switcher), `lib/session.ts` (root).
