# Home

Rendered by `app/[locale]/page.tsx`: a sequence of independent `*-section.tsx` files, no shared state between them.

## Add a new home page section

1. Create `features/home/components/your-section.tsx`, following the pattern of an existing one (e.g. `faq-section.tsx`): a server component reading its own translation namespace via `getTranslations`, no props.
2. Import and place it in `app/[locale]/page.tsx` in the order you want it to appear — sections are plain JSX siblings, there's no registry/config to update.
3. Add the section's translation namespace/keys to all 11 locale files under `apps/web/messages/*.json`.

## Add/change a featured presence card on the home page

1. `hero-presence-cards.ts` holds the static list of presences featured in the hero — edit the array there, not inside `hero-cards.tsx`.
2. `hero-cards.tsx`/`presence-card.tsx` just render whatever `hero-presence-cards.ts` gives them.

## Notable dependencies
`@nowly/ui`, `components/presence-tile.tsx` and `components/extension-store-button.tsx` (root, shared with other features).
