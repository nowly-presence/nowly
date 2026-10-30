# @nowly/ui

Shared React components for web and docs.

- One component per `src/<name>.tsx` with its own package subpath export; static imports only. Client-compatible components may also be re-exported from `src/index.ts`; server-only ones (the footer) never are: import `@nowly/ui/footer` directly.
- Shared components resolve their own translations with next-intl from `packages/locales/messages/shared`; never pass translated labels from app wrappers. Edit each of the 11 shared locale files once instead of app catalogs.
- Footer links: edit `src/footer.tsx` (`columns`, `legalLinks`) and add the keys to the shared catalogs. App footers only supply the brand and actions.
- Navbar links: edit the single list in `src/navbar.tsx` (desktop `navbar-links.tsx`, mobile `navbar-mobile.tsx`). App wrappers only supply routing context, the brand and the download button. Cross-app URLs keep the locale and the docs base path. Canary styling and download telemetry stay in the web wrapper.
- After changes: `pnpm --filter @nowly/ui typecheck`, then lint web and docs (`pnpm --filter @nowly/web lint`, `pnpm --filter @nowly/docs lint`). Both apps transpile this package and scan it for Tailwind classes.
