# Home

`app/[locale]/page.tsx` stacks independent `components/*-section.tsx` server components (no props, own translation namespace, no registry).

- New section: build it like `faq-section.tsx`, place it in `page.tsx` and add its namespace to all 11 locales. Backgrounds alternate plain and `homeSectionAltClass`: inserting a section flips every later one, so restore the alternation.
- Hero presences: edit only the array in `hero-presence-cards.ts`.
- At most one button (variant `inverted`) under a section heading; other destinations go in one discreet line of inline links (see `faq.more`).
- Community counts come from `lib/discord.ts` and hide below `MIN_DISPLAYED_MEMBERS` or when Discord is unreachable. The `/support#donate` link under the Discord button stays a single line.
