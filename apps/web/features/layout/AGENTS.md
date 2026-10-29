# Layout

Visual shell mounted around `{children}` in `app/[locale]/layout.tsx`: `navbar.tsx`, `navbar-links.tsx`, `footer.tsx`, `cookie-banner.tsx`, `theme-toggle.tsx`, `theme-url-override.tsx` (lets `?theme=dark` force a theme, used by `components/providers.tsx`), `brand-lockup.tsx` (the logo, used by both navbar and footer).

## Add a link to the footer

Don't edit `footer.tsx` in this folder — it's a thin wrapper. The actual link structure lives in `packages/ui/src/footer.tsx` and is shared with `apps/docs`. Follow the steps in `packages/ui/AGENTS.md` ("Add a link to the footer"), which also covers adding the translation key and wiring the label here.

## Add a link to the navbar

`navbar.tsx` is a thin wrapper around `@nowly/ui/navbar`. The shared link list, desktop hover animation and mobile menu live in `packages/ui/src/navbar*.tsx`. Follow `packages/ui/AGENTS.md`; never add app-specific navbar links in this wrapper. The wrapper only supplies routing context, the brand and the download button (including Canary styling and telemetry). Translations live in `packages/locales/messages/shared` and are resolved inside the shared component.

## Gotchas

- `app/[locale]/layout.tsx` also mounts the seasonal theme (`SeasonBootScript` before the shell, `SeasonProvider` inside the `relative` wrapper, which positions the decor layer). Keep both; see `features/seasonal/AGENTS.md`.

- `navbar.tsx` special-cases `/canary`: on that route the `ExtensionStoreButton` gets canary-branded colors (`CANARY_ACCENT`/`CANARY_INK` from `lib/brand.ts`, root). If you add another route with a distinct navbar look, follow the same `pathname === "..."` pattern rather than adding a new prop.
- `theme-url-override.tsx` only reads the URL once on mount — it's meant for one-off links (e.g. marketing emails), not a persistent theme switch mechanism.

## Notable dependencies
`@nowly/ui` (`Footer`, `LocaleSelector`, `LocaleFlag`), `@nowly/locales`, `lib/telemetry.ts` (website consent).
