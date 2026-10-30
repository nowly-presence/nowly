# Seasonal

Seasonal colours and light decor on nowly.me, only while the visitor's extension sends a season. Visual only: no prank, no Nolo, no sound, nothing that blocks or delays reading. `apps/docs` is out of scope.

- The site never computes the season: it asks with `GET_SEASON` and listens for `SEASON` (same window, same origin) from the extension (protocol in `apps/extension/AGENTS.md`). Never persist or restore a season: the boot script clears stale classes, and hiding the tab or starting a request removes everything until a fresh answer arrives.
- Pure rules and the boot script live in `lib/site-season.ts`, the browser lifecycle in `lib/site-season-sync.ts`; both are tested.
- Season ids mirror the extension (`SITE_SEASONS`); unknown ids count as no season. New season: extension calendar first, then `SITE_SEASONS`, `season-tokens.css` and `SEASON_SCENES`.
- Colours only through tokens in `season-tokens.css` (`html.season-<id>`, `html.dark.season-<id>`), keeping AA contrast for `primary` and `muted-foreground`. Never put a colour in a component.
- `SeasonDecor` loads after idle (`next/dynamic`, `ssr: false`) behind the content (`z-index: -1`): it must never affect LCP or CLS or take clicks. At most 14 particles, CSS-only motion, side gutters only; nothing falls under reduced motion.
- `components/season-shapes.ts` copies the extension's `components/shared/season-shapes.ts`: change both.
- Development preview only: `?season=<id>` or `?season=none`, combined with `?theme=light|dark`.
