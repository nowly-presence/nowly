# Seasonal

Seasonal theme of nowly.me, shown only to visitors whose extension has seasonal themes on. Visual only: colours and light decor; no prank, sound, or anything that blocks or delays reading. `apps/docs` is out of scope.

## How the season arrives

- The site never computes the season. The extension's content script sends it resolved (setting, local date, canary override): `{ source: "Nowly", type: "SEASON", payload: { season } }` on start, on setting change, and in answer to `{ source: "Nowly", type: "GET_SEASON" }`. Protocol: `apps/extension/AGENTS.md` ("Seasons on nowly.me").
- `SeasonBootScript` (`components/season-boot-script.tsx`, inline at the top of `app/[locale]/layout.tsx`) removes stale seasonal classes and the obsolete `nowly-season` cache before first paint. Never restore a season from storage, colours included. Only an explicit development preview may activate a season before the extension answers.
- `SeasonProvider` (`components/season-provider.tsx`) delegates to `startSiteSeason` (`lib/site-season-sync.ts`, tested with real event dispatch and fake timers). It sends `GET_SEASON` on mount and whenever the tab becomes visible, and accepts `SEASON` only from the same window and origin, while visible.
- Hiding the tab, `pagehide`, or starting a new request removes all season classes and decor immediately (no fade, no delayed React update). Restoring colours or effects always needs a fresh answer, even for the same season; back-forward cache restores revalidate too.
- Each visible request has a new `SEASON_RESPONSE_TIMEOUT_MS` deadline (4 s, `lib/site-season.ts`); without an answer the page stays neutral. Seasons are never persisted.
- Pure rules (message parsing, state transitions, class toggling, boot script) live in `lib/site-season.ts`. A pending state always has `season: null`; an unknown season id counts as no season. Tests: `pnpm --filter @nowly/web exec vitest run`.

## Seasons and tokens

- Ids mirror the extension: `spring`, `summer`, `autumn`, `winter`, `halloween`, `new-year` (`SITE_SEASONS`). To add one: extension calendar first, then `SITE_SEASONS`, `season-tokens.css`, `SEASON_SCENES`.
- `season-tokens.css` (imported at the top of `app/globals.css`) overrides site tokens per season: `html.season-<id>` (light) and `html.dark.season-<id>` (dark); the `html` prefix beats `:root`/`.dark` regardless of import order. Keep `primary` on `background`, `section-alt` and `card`, and `muted-foreground` everywhere, at AA contrast. Decor colours are tokens too (`--season-tone-1..4`, `--season-glow`, `--season-frost`, `--season-particle-opacity`). Never put a colour in a component.

## Decor

- `SeasonDecor` (`components/season-decor.tsx`) loads through `next/dynamic` (`ssr: false`) once the browser is idle after first render, so it never affects LCP or CLS. It is an absolute `z-index: -1` layer inside the layout's `relative` wrapper: behind content, no clicks, fades in. CSS hides the whole layer unless its `data-season` matches the active class on `<html>`, so removing the class hides stale markup synchronously (no exit animation).
- Scenes per season are in `components/season-scenes.ts`. Shapes are hand-made 24px paths in `components/season-shapes.ts`, a copy of `apps/extension/src/components/shared/season-shapes.ts`: change both.
- At most 14 particles (`PARTICLE_COUNT`), from a fixed seed, only in the side gutters (`--gutter`, the space outside the 80rem content); smaller between 40rem and 88rem, 7 tucked to the edges on mobile. CSS only (`transform`, `opacity`). They pause when the tab is hidden (`data-paused`).
- Also a soft glow at the top (behind the hero) and bottom (behind the footer), and resting shapes in the hero margins on large screens. Under reduced motion nothing falls; colours, glows and resting shapes remain.
- `season-css.d.ts` lets `style` take CSS custom properties (`--size`, `--delay`...).

## Preview

Development only (`NODE_ENV !== "production"`): `?season=<id>` forces a season, `?season=none` removes it, without the extension. Combine with `?theme=light|dark`.
