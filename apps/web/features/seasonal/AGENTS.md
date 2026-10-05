# Seasonal

Seasonal theme of nowly.me, shown only to visitors whose extension is installed with seasonal themes on. Visual only: colours and a light decor, no prank, no Nolo, no sound, nothing that blocks or delays reading. `apps/docs` and `apps/insights` are out of scope.

## How the season arrives

- The site never computes the season. The extension's content script sends it already resolved (setting, local date, canary override): `{ source: "Nowly", type: "SEASON", payload: { season } }`, on start, when the setting changes, and in answer to `{ source: "Nowly", type: "GET_SEASON" }`. Protocol details in `apps/extension/AGENTS.md` ("Seasons on nowly.me").
- `SeasonBootScript` (`components/season-boot-script.tsx`, an inline script at the top of `app/[locale]/layout.tsx`) puts the remembered season (`nowly-season` in `localStorage`) on `<html>` before the first paint, so there is no flash.
- `SeasonProvider` (`components/season-provider.tsx`, mounted in the same layout) asks with `GET_SEASON` on mount and whenever the tab becomes visible again, and listens for `SEASON` (same window, same origin only). The answer confirms, changes or removes the class and is stored. Without an answer within `SEASON_RESPONSE_TIMEOUT_MS` (4 s: extension uninstalled, too old, or no extension) the class fades out (`season-leaving` animates the colours for `SEASON_FADE_MS`) and the stored value is cleared.
- All rules are pure functions in `lib/site-season.ts` (tested in `lib/site-season.test.ts`, run with `pnpm --filter @nowly/web exec vitest run`): message parsing, state transitions, what to store, class toggling and the boot script itself. A season id the site does not know yet counts as no season.

## Seasons and tokens

- Ids mirror the extension: `spring`, `summer`, `autumn`, `winter`, `halloween`, `new-year` (`SITE_SEASONS`). Adding one: add it to the extension calendar first, then to `SITE_SEASONS`, to `season-tokens.css` and to `SEASON_SCENES`.
- `season-tokens.css` (imported at the top of `app/globals.css`) overrides the site tokens per season, light (`html.season-<id>`) and dark (`html.dark.season-<id>`). The `html` prefix makes them win over `:root` and `.dark` whatever the import order. Values follow the extension's season tokens, adjusted so `primary` on `background`, `section-alt` and `card` and `muted-foreground` everywhere stay AA. Decor colours are tokens too: `--season-tone-1..4`, `--season-glow`, `--season-frost`, `--season-particle-opacity`. Never put a colour in a component.

## Decor

- `SeasonDecor` (`components/season-decor.tsx`) is loaded with `next/dynamic` (`ssr: false`) once the browser is idle after the first render, so it never weighs on LCP or CLS. It is an absolute layer with `z-index: -1` in the layout wrapper (`relative`): it stays behind the content, takes no clicks and fades in.
- Per season (`components/season-scenes.ts`): falling leaves for autumn and Halloween, snowflakes and frosted corners for winter, petals and blossoms for spring, rising light motes and sparkles for summer, confetti and stars for the new year. Shapes are hand-made 24px paths (`components/season-shapes.ts`, a copy of the extension's `components/shared/season-shapes.ts`: change both).
- 14 particles at most, generated from a fixed seed, only in the side gutters (`--gutter`: the space outside the 80rem content), smaller between 40rem and 88rem, 7 and tucked to the edges on mobile. Each one is CSS only (`transform` and `opacity`): a fall or rise, a sway with rotation, a fade in and out. They pause when the tab is hidden (`data-paused`).
- Discreet touches: a soft glow at the top (behind the hero) and at the bottom (behind the footer), and three resting shapes in the hero margins on large screens.
- Under reduced motion nothing falls: only the colours, the glows and the resting shapes remain.
- `season-css.d.ts` lets `style` take CSS custom properties (`--size`, `--delay`...).

## Preview

- Development only (`NODE_ENV !== "production"`): `?season=<id>` forces a season and `?season=none` removes it, without the extension and without touching the stored value. Combine with `?theme=light|dark`.
