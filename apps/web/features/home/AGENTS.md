# Home

Rendered by `app/[locale]/page.tsx`: a sequence of independent `*-section.tsx` files, no shared state between them.

## Add a new home page section

1. Create `features/home/components/your-section.tsx`, following the pattern of an existing one (e.g. `faq-section.tsx`): a server component reading its own translation namespace via `getTranslations`, no props.
2. Import and place it in `app/[locale]/page.tsx` in the order you want it to appear — sections are plain JSX siblings, there's no registry/config to update.
   Section backgrounds alternate: plain, then `homeSectionAltClass` (from `section-heading.tsx`), and so on. Inserting a section shifts that parity for every section after it, so flip those too instead of leaving two neighbours on the same background (the community section is "alt", hence the final CTA is plain).
3. Add the section's translation namespace/keys to all 11 locale files under `apps/web/messages/*.json`.

## Add/change a featured presence card on the home page

1. `hero-presence-cards.ts` holds the static list of presences featured in the hero — edit the array there, not inside `hero-cards.tsx`.
2. `hero-cards.tsx`/`presence-card.tsx` just render whatever `hero-presence-cards.ts` gives them.

## Section calls to action

Under a section's heading there is at most one button (variant `inverted`). Secondary destinations go in one discreet line of inline links under it, as `faq.more` does for the guides and Discord in `faq-section.tsx`.

## Community section

`community-section.tsx` pitches the Discord and shows member/online counts from `lib/discord.ts` (server-side fetch of the public invite, cached 1h). Counts are hidden below `MIN_DISPLAYED_MEMBERS` or when Discord can't be reached; the hero pill reads the same helper. Under the Discord button, one discreet line (`community.support`) links to `/support#donate`; keep it a line, not a block. It says "free", not "open source": the main code is BUSL-1.1 (source-available), only presences are MIT.

## Notable dependencies
`@nowly/ui`, `components/presence-tile.tsx` and `components/extension-store-button.tsx` (root, shared with other features).
