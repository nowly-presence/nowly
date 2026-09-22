# Consent

Rendered by `app/[locale]/consent`: `consent-view.tsx` lets users accept/decline analytics tracking. Also surfaced by `features/layout/components/cookie-banner.tsx` on first visit.

## Add a new consent category

1. The category list is defined in `packages/analytics` (the schema/source of truth for what "consent" covers) — add it there first.
2. Update `consent-view.tsx` to render a toggle/section for the new category, reading/writing through `lib/analytics.ts` (root, shared) rather than a category-specific ad-hoc storage key.
3. `cookie-banner.tsx` (in `features/layout`) reuses the same consent state — verify it still makes sense as an accept/decline shortcut once a third category exists (it may need its own copy update).

## Notable dependencies
`lib/analytics.ts` (root), `packages/analytics`, `features/layout` (cookie banner).
