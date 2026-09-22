# Layout

Visual shell mounted around `{children}` in `app/[locale]/layout.tsx`: `navbar.tsx`, `footer.tsx`, `cookie-banner.tsx`, `theme-toggle.tsx`, `theme-url-override.tsx` (lets `?theme=dark` force a theme, used by `components/providers.tsx`), `brand-lockup.tsx` (the logo, used by both navbar and footer).

## Add a link to the footer

Don't edit `footer.tsx` in this folder — it's a thin wrapper. The actual link structure lives in `packages/ui/src/footer.tsx` and is shared with `apps/docs`. Follow the steps in `packages/ui/AGENTS.md` ("Add a link to the footer"), which also covers adding the translation key and wiring the label here.

## Add a link to the navbar

`navbar.tsx` builds its links from a plain array, not a shared component (each app's navbar is free to differ, unlike the footer):

1. Open `apps/web/features/layout/components/navbar.tsx`.
2. Add an entry to the `links` array (around line 24): `{ href: "/your-path", label: t("your-key"), external: false }` (use `external: true` and a full URL for off-domain links, e.g. `docsHref("/")` for a docs link).
3. Add the translation key `your-key` to the `navbar` namespace in all 11 files under `apps/web/messages/*.json`.
4. The array is rendered twice (desktop nav and mobile `Sheet`) — no extra step needed, both read the same `links` array.

## Gotchas

- `navbar.tsx` special-cases `/canary`: on that route the `ExtensionStoreButton` gets canary-branded colors (`CANARY_ACCENT`/`CANARY_INK` from `lib/brand.ts`, root). If you add another route with a distinct navbar look, follow the same `pathname === "..."` pattern rather than adding a new prop.
- `theme-url-override.tsx` only reads the URL once on mount — it's meant for one-off links (e.g. marketing emails), not a persistent theme switch mechanism.

## Notable dependencies
`@nowly/ui` (`Footer`, `LocaleSelector`, `LocaleFlag`), `@nowly/locales`, `packages/analytics` (consent).
