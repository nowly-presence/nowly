# Layout

Shell mounted in `app/[locale]/layout.tsx`: `navbar.tsx`, `footer.tsx`, `cookie-banner.tsx`, `theme-toggle.tsx`, `brand-lockup.tsx`.

## Footer

`footer.tsx` is a thin wrapper around the shared `Footer` in `packages/ui`. Links are not editable here; follow "Add a link to the footer" in `packages/ui/AGENTS.md`. A footer that differs from web's is a bug in `packages/ui/src/footer.tsx` or in `LocaleSelector`/`LocaleFlag`.

## Add a navbar link

`components/navbar.tsx` is a thin wrapper around `@nowly/ui/navbar`, shared with web. Update links and desktop/mobile presentation in `packages/ui/src/navbar*.tsx`, following `packages/ui/AGENTS.md`. Keep app routing and the download button in the wrapper. Translations are resolved in the shared component from `packages/locales/messages/shared`. Docs links stay local; marketing links and the brand resolve to localized nowly.me URLs.
