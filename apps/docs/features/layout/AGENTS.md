# Layout

Visual shell mounted around `{children}` in `app/[locale]/layout.tsx`: `navbar.tsx`, `footer.tsx`, `cookie-banner.tsx`, `theme-toggle.tsx`, `brand-lockup.tsx` (the logo).

## Add a link to the footer

Don't edit `footer.tsx` in this folder — it's a thin wrapper. The actual link structure lives in `packages/ui/src/footer.tsx` and is shared with `apps/web`. Follow the steps in `packages/ui/AGENTS.md` ("Add a link to the footer"), which also covers adding the translation key and wiring the label here. Editing the link list in only one app's wrapper is not possible by design — there's nothing to edit there — so if the two footers ever look different again, the bug is in `packages/ui/src/footer.tsx` or in one app's `LocaleSelector`/`LocaleFlag` rendering, not in this folder.

## Add a link to the navbar

1. Open `apps/docs/features/layout/components/navbar.tsx`.
2. Add an entry to the `links` array (around line 18): `{ href: "/your-path", label: t("your-key"), external: false }`. For a link to `apps/web` use `` `${SITE_URL}/path` `` (from `lib/constants.ts`, root) with `external: true`, same as the existing `library` link.
3. Add the translation key `your-key` to the `navbar` namespace in all 11 files under `apps/docs/messages/*.json`.

## Gotchas
- This navbar is deliberately simpler than `apps/web`'s (no canary-branding special case) — don't copy that logic here unless docs actually needs a canary-styled route.

## Notable dependencies
`@nowly/ui` (`Footer`, `LocaleSelector`, `LocaleFlag`), `@nowly/locales`.
