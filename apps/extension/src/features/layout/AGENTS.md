# Layout

The visual shell of the extension's panel, mounted in `entrypoints/sidepanel/app.tsx`: `header.tsx` (title/logo, also reused by `onboarding`), `connection-status-bar.tsx` (native host connection state — `isConnectionHealthy` also consumed by `settings/sections/native-connection-section.tsx`), `bottom-nav.tsx` (switches between `activity`/`store`/`settings`).

## Add a new bottom-nav tab

1. Add the tab id/icon to `bottom-nav.tsx`.
2. In `entrypoints/sidepanel/app.tsx`, add the corresponding screen render branch alongside the existing `activity`/`store`/`settings` cases.
3. These are purely presentational components with no state of their own — any new behavior belongs in the screen it navigates to, not in `bottom-nav.tsx` itself.

## Gotchas
- `connection-status-bar.tsx` exports `isConnectionHealthy` as a standalone function specifically so `settings/sections/native-connection-section.tsx` can reuse the same health check — if you change what counts as "healthy", update it there, don't duplicate the logic.

## Notable dependencies
`background/` (connection state via the message router), `components/shared` (reusable primitives like `back-button`/`heading-text`).
