# Canary

- Zip URLs: `CANARY_EXTENSION_ZIP_URL` and `CANARY_FIREFOX_ZIP_URL` (`lib/constants.ts`), mapped per browser by `zipUrl` in `canary-view.tsx`. A new browser first follows `features/extension/AGENTS.md`.
- Reuse `CANARY_ACCENT`, `CANARY_INK` and `BRAND_LOCKUP_CANARY` (`lib/brand.ts`); never hardcode canary colors.
- The canary navbar look is route-driven in `features/layout/components/navbar.tsx` (`usePathname() === "/canary"`); nothing is themed from this feature.
