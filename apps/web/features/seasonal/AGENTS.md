# Seasonal

Seasonal theme of nowly.me, shown only to visitors whose extension is installed with seasonal themes on. Visual only: colours and a light decor, no prank, no Nolo, no sound, nothing that blocks or delays reading. `apps/docs` is out of scope.

## How the season arrives

- The site never computes the season. The extension's content script sends it already resolved (setting, local date, canary override): `{ source: "Nowly", type: "SEASON", payload: { season } }`, on start, when the setting changes, and in answer to `{ source: "Nowly", type: "GET_SEASON" }`. Protocol details in `apps/extension/AGENTS.md` ("Seasons on nowly.me").
- `SeasonBootScript` (`components/season-boot-script.tsx`, an inline script at the top of `app/[locale]/layout.tsx`) removes stale seasonal classes and the obsolete `nowly-season` cache before the first paint. No season is restored from storage, including colours. Only an explicit development preview may activate a season before the extension answers.
- `SeasonProvider` (`components/season-provider.tsx`, mounted in the same layout) delegates the browser lifecycle to `startSiteSeason` (`lib/site-season-sync.ts`, tested with real event dispatch and fake timers). It asks with `GET_SEASON` on mount and whenever the tab becomes visible again, and listens for `SEASON` (same window, same origin only, while visible). Hiding the tab, leaving the page or starting a request immediately removes all season classes and decor, without a fade or a delayed React update. A fresh answer is required to restore any seasonal colours or effects, even if the season is unchanged. Back-forward cache restores revalidate too. Each visible request has a new `SEASON_RESPONSE_TIMEOUT_MS` deadline (4 s); without an answer the page stays neutral. Seasons are never persisted.
- Pure rules live in `lib/site-season.ts` (tested in `lib/site-season.test.ts`, run all tests with `pnpm --filter @nowly/web exec vitest run`): message parsing, state transitions, class toggling and the boot script itself. A pending state always has `season: null`. A season id the site does not know yet counts as no season.

## Seasons and tokens

- Ids mirror the extension: `spring`, `summer`, `autumn`, `winter`, `halloween`, `new-year` (`SITE_SEASONS`). Adding one: add it to the extension calendar first, then to `SITE_SEASONS`, to `season-tokens.css` and to `SEASON_SCENES`.
- `season-tokens.css` (imported at the top of `app/globals.css`) overrides the site tokens per season, light (`html.season-<id>`) and dark (`html.dark.season-<id>`). The `html` prefix makes them win over `:root` and `.dark` whatever the import order. Values follow the extension's season tokens, adjusted so `primary` on `background`, `section-alt` and `card` and `muted-foreground` everywhere stay AA. Decor colours are tokens too: `--season-tone-1..4`, `--season-glow`, `--season-frost`, `--season-particle-opacity`. Never put a colour in a component.

## Decor

- `SeasonDecor` (`components/season-decor.tsx`) is loaded with `next/dynamic` (`ssr: false`) once the browser is idle after the first render, so it never weighs on LCP or CLS. It is an absolute layer with `z-index: -1` in the layout wrapper (`relative`): it stays behind the content, takes no clicks and fades in. CSS hides the entire layer by default, including glows, frost and resting shapes, unless its `data-season` matches the active class on `<html>`. Removing a class hides stale React markup synchronously; there is no exit animation.
- Per season (`components/season-scenes.ts`): falling leaves for autumn and Halloween, snowflakes and frosted corners for winter, petals and blossoms for spring, rising light motes and sparkles for summer, confetti and stars for the new year. Shapes are hand-made 24px paths (`components/season-shapes.ts`, a copy of the extension's `components/shared/season-shapes.ts`: change both).
- 14 particles at most, generated from a fixed seed, only in the side gutters (`--gutter`: the space outside the 80rem content), smaller between 40rem and 88rem, 7 and tucked to the edges on mobile. Each one is CSS only (`transform` and `opacity`): a fall or rise, a sway with rotation, a fade in and out. They pause when the tab is hidden (`data-paused`).
- Discreet touches: a soft glow at the top (behind the hero) and at the bottom (behind the footer), and three resting shapes in the hero margins on large screens.
- Under reduced motion nothing falls: only the colours, the glows and the resting shapes remain.
- `season-css.d.ts` lets `style` take CSS custom properties (`--size`, `--delay`...).

## Preview

- Development only (`NODE_ENV !== "production"`): `?season=<id>` forces a season and `?season=none` removes it, without the extension. Combine with `?theme=light|dark`.
