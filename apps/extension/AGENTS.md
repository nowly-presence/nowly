# Nowly extension

MV3 side-panel extension for Chromium and Firefox.

## Commands

- `pnpm --filter @nowly/extension lint` (tsc), `test` (vitest), `preview` (mocked runtime on http://127.0.0.1:5173; feature `AGENTS.md` files list their preview query params).
- Never run builds unless the user asks: they handle local builds. `build` makes the store builds, `build:chrome` a lean canary, `build:chrome --bundled` a canary with the local presences from `packages/presences/dist`. Real check: load `dist/chrome` unpacked.
- Guide screenshots: `NOWLY_PREVIEW_CHANNEL=stable pnpm --filter @nowly/extension preview` with `?lang=en&season=none` (stable branding, mocked runtime).

## Structure

- Dependency direction: `entrypoints` > `features` > `components/shared` > `ui`; features and components may use `hooks`, `lib` and `shared`. A feature never imports another feature: move shared UI to `components/shared` and shared logic to `lib` or `hooks`. `ui` imports only `ui` and third-party packages.
- The UI reaches the background only through `sendMessage` (`lib/messages.ts`) and `useExtensionState`; from `background/` it may import only types (`router/contracts.ts`, `storage/*.store.ts`). `background/` and `content/` never import UI code.
- New screen: `features/<name>/<name>-view.tsx`, registered as a tab in `entrypoints/sidepanel/app.tsx` or as a `Route` in `hooks/navigation-provider.tsx`. App-wide overlays mount once at the end of `app.tsx`.
- New background capability: see `src/background/AGENTS.md`. Logic shared by background and UI goes in `shared/`.
- Check `ui/` before writing a primitive; never re-create a button, row, select, sheet or chip locally. Split files past about 200 lines or mixed responsibilities.
- Announce a feature to existing users with `<FeatureReveal id version text hint?>` (`components/shared/feature-reveal.tsx`): shown once per id, only on the release line of `version`, after onboarding.

## Code rules

- Arrow functions only. Strict TypeScript: no `any`, no non-null or `as` casts except at real boundaries (storage reads, JSON, DOM events).
- No comments in source files (TS, TSX, CSS) except tooling directives: knowledge goes in the closest `AGENTS.md`.
- No `utils.ts`, `helpers.ts` or `misc.ts`: name modules after what they do. Name constants instead of magic numbers.
- UI strings: add the `area.name` key to every `messages/*.json` (a missing locale fails the build).
- Never use em dashes, en dashes, spaced hyphens as dashes or middle dots in any text (UI, code, docs, commits). Inline separators use `ui/dot-separator.tsx`.
- Design follows https://nowly.me/design.md: only tokens from `ui/tokens.css`, Satoshi only, no heavy shadows, no saturated secondary colours.

## Seasons and Nolo

- `resolveSeason` (`shared/seasonal-themes.ts`, tested) is the single rule: seasonal themes enabled, then the override, then the local date. The calendar only uses fixed worldwide dates (no Easter, lunar dates or national holidays); a period can be disabled (`enabled`) or ended (`lastYear`).
- Seasons are token overrides only (`.season-<id>` in `ui/tokens.css`), never colours in components. `components/shared/season-shapes.ts` is copied in `apps/web/features/seasonal/components/season-shapes.ts`: change both.
- nowly.me gets the resolved season only from `content/web-season.ts`: `{ source: "Nowly", type: "SEASON", payload: { season } }`, on start, when `settings` or `seasonOverride` change, and in answer to `GET_SEASON`, on allowed origins only and never with other data. The content script reads storage directly so it answers while the worker sleeps.
- Never edit the byte-for-byte prototype copies: `components/shared/nolo-mascot.tsx`, `nolo-paths.ts`, `src/assets/nolo/` and `ui/streaming-text.tsx`. Costumes wrap Nolo (`CostumedNolo`, `nolo-costume-paths.ts`) and never cover his eyes (nothing below y 76 above them).
- Nolo appears only in feature reveals, the Halloween prank and season moments.

## Account and sync

- Optional and discreet: no banner, nothing in the onboarding, nothing blocked without an account. The only entry point is Settings, Account and sync.
- Synced: `settings` (only `SYNCED_SETTINGS_KEYS`), store `presences` (`{ slug, enabled, schedule?, installedAt }`), `presenceSettings` and `featureReveals`. Never device-specific settings (`customApiBaseUrl`, `developerMode`, `presencePaused`), local zips, bundled presences, current activity, tabs, URLs or history. Merge rules are pure in `shared/account-sync.ts` (tested); the flow is in `src/background/AGENTS.md`.

## Gotchas

- Canary builds embed the dev manifest key (ID `abbegmindbabanjcabnmcjmamaoffbam`, allow-listed by the native host). Store builds strip it and are pinned to production endpoints; `VITE_*` overrides apply to canary builds only.
- Presence assets: `https://cdn.nowly.me/presences/<slug>/assets/{logo.png,icon.png,thumbnail.jpg}` (`shared/presence-assets.ts`).
- The language sent to Discord is resolved only by `shared/presence-language.ts`, shared by runtime and UI. The global choice only lists locales every installed presence ships (`lib/presence-locales.ts`).
- Publication dates come only from the API (`addedAt` = first publication, `lastUpdated` = latest), normalised in `shared/presence-catalog.ts`. Never substitute local install, cache or CDN dates, or read the API's internal `updatedAt`. Wording: "Published" = `addedAt`, "Last updated" = `lastUpdated` (only when later), "Added on" = local `installedAt`.
