# Layout

Shell mounted in `app/[locale]/layout.tsx`: `navbar.tsx`, `footer.tsx`, `cookie-banner.tsx`, `theme-toggle.tsx`, `brand-lockup.tsx`.

## Footer

`footer.tsx` is a thin wrapper around the shared `Footer` in `packages/ui`. Links are not editable here; follow "Add a link to the footer" in `packages/ui/AGENTS.md`. A footer that differs from web's is a bug in `packages/ui/src/footer.tsx` or in `LocaleSelector`/`LocaleFlag`.

## Add a navbar link

1. In `components/navbar.tsx`, add an entry to the `links` array: `{ href: "/path", label: t("your-key"), external: false }`. For a link to `apps/web` use `` `${SITE_URL}/path` `` (`lib/constants.ts`) with `external: true`, like `library`.
2. Add `your-key` to the `navbar` namespace in all 11 `apps/docs/messages/*.json`.

The navbar is intentionally simpler than web's (no canary branding); don't port that logic without a docs need.
