# Consent

Rendered by `app/[locale]/consent`: `consent-view.tsx` lets users accept/decline analytics tracking. Also surfaced by `features/layout/components/cookie-banner.tsx` on first visit.

## Consent boundaries

1. Website consent is local to the site via `lib/telemetry.ts`; the cookie banner offers accept and decline. It never grants extension consent.
2. Extension consent is read/written through the extension bridge. Withdrawal erases local telemetry cohort/deduplication markers and sends no withdrawal event.
3. `packages/telemetry` is the closed event/property contract. Change disclosures in all locales and the privacy manifest before widening it. No persistent site-extension identity is authorized.
4. Device export/erasure is authenticated functional service data, including historical analytics. New aggregate events cannot be located by device ID.

## Notable dependencies
`lib/telemetry.ts`, `packages/telemetry`, `features/layout` (cookie banner), extension bridge.
