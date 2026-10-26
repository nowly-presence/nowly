# Home

`app/[locale]/page.tsx` stacks independent `components/*-section.tsx` files with no shared state.

## Add a section

1. Create `components/your-section.tsx` like `faq-section.tsx`: a server component, no props, reading its own namespace via `getTranslations`.
2. Place it in `app/[locale]/page.tsx`; sections are plain JSX siblings, no registry.
   Backgrounds alternate plain / `homeSectionAltClass` (from `section-heading.tsx`). Inserting a section flips the parity of every later one: flip them too so no two neighbours share a background (community is "alt", so the final CTA is plain).
3. Add the namespace/keys to all 11 `messages/*.json`.

## Hero

- `hero-presence-cards.ts` holds the presences featured in the hero; edit the array there, not in `hero-cards.tsx` or `presence-card.tsx`, which just render it.
- `hero-cards.tsx` is a client component animating the cards on a rotating ring (rAF, `PERIOD_MS`), desktop only (`min-width: 1024px`). It pauses on hover, focus inside, drag, hidden tab and `prefers-reduced-motion`. It has no visible carousel controls; the `hero.carousel.*` messages are currently unused.

## Section calls to action

At most one button (variant `inverted`) under a section heading. Secondary destinations go in one discreet line of inline links, as `faq.more` does in `faq-section.tsx`.

## Community section

`community-section.tsx` pitches the Discord and shows member/online counts from `lib/discord.ts` (server fetch of the public invite, cached 1h). Counts are hidden below `MIN_DISPLAYED_MEMBERS` or when Discord is unreachable; the hero pill uses the same helper. Under the Discord button, one discreet line (`community.support`) links to `/support#donate`: keep it a line, not a block. Public Nowly repositories are MIT-licensed; the private internal CLI has separate terms.

## Notable dependencies
`@nowly/ui`, `components/presence-tile.tsx`, `components/extension-store-button.tsx`.
