# @nowly/ui

Shared React components for web and docs. Components live in `src/*.tsx`; use direct package subpath imports. Use static imports only.

## Shared translations

`packages/locales/messages/shared/<locale>.json` owns navbar, footer, theme and store translations for both apps. Edit each of the 11 locales once, not separate app files. Shared components resolve translations directly through next-intl; do not pass translated label objects through app wrappers.

## Footer

`src/footer.tsx` owns the link structure and loads `getTranslations("footer")` server-side. Add a link and its translation lookup here, then add its key to the shared catalogs. App wrappers only supply the brand and actions. Import the footer from `@nowly/ui/footer`, never from the client-compatible barrel.

## Navbar

`src/navbar.tsx` owns the single link list and shell. `navbar-links.tsx` owns the desktop hover pill and `navbar-mobile.tsx` the mobile menu. The navbar calls `useTranslations("navbar")` directly. App wrappers supply routing context, the brand and download button, never labels or a custom link list. Cross-app URLs preserve the locale and docs base path. Keep Canary styling and download telemetry in the web wrapper.

## Add a component

Create `src/<name>.tsx` and add a package subpath export. Client-compatible components may also be re-exported from `src/index.ts`; server-only components must stay separate. Use `@nowly/locales` for shared locale definitions and next-intl for translations.

## Validation

Run typecheck in `@nowly/ui`, `@nowly/web` and `@nowly/docs` after changing shared components. Both apps already transpile this package and scan its sources for Tailwind classes.
