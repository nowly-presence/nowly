# Layout

Shell mounted in `app/[locale]/layout.tsx` around `{children}`, in this order: `SeasonBootScript`, skip link, `SeasonProvider`, `announcement-bar.tsx`, `navbar.tsx`, `<main>`, `footer.tsx`, then `cookie-banner.tsx`.

Components (`components/`): `navbar.tsx` (+ `navbar-links.tsx`, `mobile-nav.tsx`), `announcement-bar.tsx` (home only, links to `#custom-activity`), `footer.tsx` (+ `footer-actions.tsx`), `cookie-banner.tsx`, `theme-toggle.tsx`, `theme-url-override.tsx`, `brand-lockup.tsx` (theme-aware logo from `lib/brand.ts`, used by navbar and footer). `lib/motion-features.ts` exports `domMax`, lazy-loaded by `navbar-links.tsx`.

## Add a link to the footer

Don't edit `footer.tsx` here: it is a thin wrapper passing labels to the shared footer in `packages/ui/src/footer.tsx` (also used by `apps/docs`). Follow "Add a link to the footer" in `packages/ui/AGENTS.md`, then add the label to `footer.tsx`'s `labels` and the `footer` namespace in all 11 locale files. `footer-actions.tsx` lazy-loads `LocaleSelector` and `ThemeToggle` when the footer scrolls into view.

## Add a link to the navbar

1. Add an entry to the `links` array in `navbar.tsx`: `{ href, label: t("your-key"), external: false }` (`external: true` plus a full URL for off-domain, e.g. `docsHref("/")`).
2. Add `your-key` to the `navbar` namespace in all 11 `messages/*.json`.
3. The same array feeds desktop (`NavbarLinks`, which owns the sliding hover pill) and the mobile `Sheet` (`MobileNav`, opened by the menu button and mounted lazily): no per-view step.

## Gotchas

- Keep both `SeasonBootScript` and `SeasonProvider` in the layout (`SeasonProvider` sits inside the `relative` wrapper that positions the decor); see `features/seasonal/AGENTS.md`.
- Canary styling: `navbar.tsx` sets `canary = pathname === "/canary"`, restyles `ExtensionStoreButton` with `CANARY_ACCENT`/`CANARY_INK` and passes `canary` to `MobileNav`, which duplicates the styling. Update both for any other route-specific look.
- `theme-url-override.tsx` reads `?theme=` once on mount (used by `components/providers.tsx`); it is for one-off links, not a persistent theme switch.
- `cookie-banner.tsx` is a dismissible notice persisted in `localStorage` (`nowly_cookie_dismissed`); it does not store or change analytics consent (see `features/consent`).

## Notable dependencies
`@nowly/ui` (`Footer`, `LocaleSelector`), `@nowly/locales`.
