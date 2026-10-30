# Layout

- `navbar.tsx` and `footer.tsx` are thin wrappers around `@nowly/ui`: change links, labels and presentation in `packages/ui` (see `packages/ui/AGENTS.md`). Wrappers only supply routing, the brand and the download button (with canary styling and telemetry). Never add app-specific navbar links.
- A route with a distinct navbar look follows the `/canary` pathname check in `navbar.tsx`, not a new prop.
- `app/[locale]/layout.tsx` mounts `SeasonBootScript` (before the shell) and `SeasonProvider` (inside the `relative` wrapper that positions the decor): keep both (see `features/seasonal/AGENTS.md`).
- `?theme=` (`theme-url-override.tsx`) is read once on mount, for one-off links only.
