# Nowly extension (side panel)

Chromium/Firefox MV3 extension in the Nowly monorepo: a background service worker runs presence scripts and relays activity to Discord through the Nowly Desktop native host; the side panel is the only UI. The app lives in `apps/extension` and shares workspace packages from `packages/`.

## Layout

```
src/
  entrypoints/{background,content,sidepanel}   build entries; sidepanel/ holds index.html, main.tsx, app.tsx, styles.css
  background/        service worker: router/, managers/, services/, runtime/, storage/ (no UI imports)
  content/           content script: nowly.me web protocol + presence-script relay
  features/<name>/   one folder per screen/domain, files named <feature>-<thing>.tsx, own AGENTS.md when it has recipes
  components/shared/ business components used by 2+ features (presence icon, live activity card, schedule editor...)
  ui/                design system primitives, one component per file, no business logic, no chrome.* calls
  hooks/             app-wide providers and hooks (extension state, i18n, navigation, presence actions)
  lib/               pure UI helpers (formatting, presence view model, status, messages client)
  shared/            code shared by background, content and UI (types, constants, URL patterns, locales, analytics catalog)
  preview/           mocked runtime for `npm run preview`, never bundled in the extension
messages/<locale>.json   UI strings, 11 locales (same set as nowly.me)
```

## Dependency direction

- `entrypoints` -> `features` -> `components/shared` -> `ui`; `features`/`components` may use `hooks`, `lib`, `shared`.
- A feature never imports another feature. Something needed by two features moves to `components/shared` (UI) or `lib`/`hooks` (logic).
- `ui` imports only `ui` and third-party packages.
- The UI talks to the background only through `sendMessage` (`lib/messages.ts`) and reads mirrored state from `useExtensionState`. It may import *types* from `background/router/contracts.ts` and `background/storage/*.store.ts`, nothing else from `background/`.
- `background/` and `content/` never import from `features`, `components`, `ui`, `hooks` or `lib`.

## Where does new code go

- New screen or user-facing domain: `features/<name>/`, entry component `<name>-view.tsx`, registered in `entrypoints/sidepanel/app.tsx` (tab) or as a `Route` in `hooks/navigation-provider.tsx` (pushed screen).
- App-wide overlay without its own screen (e.g. the one-time review prompt in `features/review/`, the Halloween prank in `features/seasonal/`): a component mounted once at the end of `entrypoints/sidepanel/app.tsx`.
- New piece of a screen: next to it in the same feature. Split a file when it passes ~200 lines or mixes responsibilities.
- Generic, styling-only component: `ui/<name>.tsx`. Check `ui/` first; never re-create a button, row, select, sheet or chip locally.
- New background capability: add the message to `RouterMessageMap` (`background/router/contracts.ts`) and its handler to `buildHandlerRegistry` (`background/router/handlers/index.ts`) - a missing handler is a compile error by design.
- Pure logic reused by background and UI: `shared/`.

## Code rules

- Arrow functions only; no `function` declarations.
- Strict TypeScript: no `any`, no non-null or `as` casts without a real boundary (storage reads, JSON, DOM events). Prefer discriminated unions and type guards.
- No comments in source files (TS, TSX, CSS). Knowledge goes in the closest `AGENTS.md`. Only tooling directives (`/// <reference>`) stay.
- No generic dumping grounds (`utils.ts`, `helpers.ts`, `misc.ts`); name modules after what they do.
- Name constants instead of inline magic numbers (`const MINUTE_MS = 60_000`).
- UI strings: add the key to every `messages/*.json` (the `Record<MessageKey, string>` in `hooks/i18n-provider.tsx` fails the build if one locale misses a key). Keys are `area.name` (`library.sortNew`).
- No em dash, en dash, spaced hyphen used as a dash, or middle dot in any text: UI strings, code, docs, commits. Rewrite with a period, comma, colon or parentheses. Visual separators between inline items use `ui/dot-separator.tsx`. Ranges use a plain hyphen (`A-Z`).
- Visual design follows https://nowly.me/design.md: tokens live in `ui/tokens.css` and are the only colours/radii/type sizes allowed. No heavy shadows, no saturated secondary colours, Satoshi only.

## Seasonal themes

- Appearance has three modes: `system`, `light`, `dark`. `seasonalThemes` is on by default and overlays the active season on the selected theme; turning it off removes seasonal tokens and moments.
- Periods are computed on the device's local date, no server (`shared/seasonal-themes.ts`, tested): `halloween` is October 1-31, `winter` (December) is declared but `enabled: false` until its content ships. `resolveSeason` is the single rule (seasonal themes enabled, then the override, then the date).
- `SeasonProvider` (`hooks/season-provider.tsx`, mounted in `main.tsx`) resolves the season once the state is ready, sets `season-<id>` on `<html>`, refreshes when the panel becomes visible or focused, and re-resolves at local midnight. Read it with `useSeason()` (`season`, `seasonal`, `today`, `override`).
- A season is only a token override in `ui/tokens.css` (`.season-halloween`, `.dark.season-halloween`), never colours in components. Seasonal decor (`components/shared/seasonal-decor.tsx`, passed to `EmptyState` as `decoration`) is hidden under reduced motion.
- Migration: `getSettings` converts stored `appearance: "seasonal"` from 2.2.1 to `appearance: "system"` with `seasonalThemes: true`. Users who had already turned seasonal themes off keep them off through `seasonalThemeMigrated`; that marker is removed after migration. Missing values otherwise default to seasonal themes on.
- Nolo: `nolo-mascot.tsx`, `nolo-paths.ts`, `src/assets/nolo/` and `ui/streaming-text.tsx` are byte-for-byte copies from the 2.3.0 branch, do not edit them here. Costumes wrap him instead: `CostumedNolo` (`components/shared/nolo-costumed.tsx`) with `costume="halloween"`, accessory paths in `nolo-costume-paths.ts` (viewBox 512, same as Nolo; `overhang` is the share of `size` the accessory sticks out above the disc) and colours in `ui/tokens.css` (`.nolo-costume-<id>`, which also recolours the disc through `--primary`). To use a designer's drawing, replace that costume's `layers` and `transform`, nothing else.
- Canary developer settings have "Force the season" (`seasonOverride` in `chrome.storage.local`: a season, `none`, or removed for automatic) and "Replay the Halloween prank". The preview takes `?season=halloween|none` (enables seasonal themes, with `theme=light|dark` selecting the base scheme) and `?prank=1`.

## Validation

`npm run lint` (tsc), `npm test` (vitest), `npm run build` (Chrome + Firefox store builds). Visual check: `npm run preview` (http://127.0.0.1:5173, query params in README). Real check: load `dist/chrome` unpacked.
- Canary builds do not bundle the local presence catalog by default. Use `pnpm build:chrome` for a lean canary, or `pnpm build:chrome -- --bundled` when testing bundled presences and their assets.

## Gotchas

- Canary builds embed the dev manifest key so the unpacked extension gets ID `abbegmindbabanjcabnmcjmamaoffbam`, the dev ID allow-listed by the native host (prod: `kmnlnfldimgneaopdihplkebobckcjpf`). Store builds strip the key.
- Store builds are pinned to production endpoints; `.env` overrides (`VITE_API_BASE_URL`, `VITE_WEB_BASE_URL`, `VITE_CDN_BASE_URL`) apply to canary builds only.
- Presence assets are served from the CDN with the presences repo layout: `https://cdn.nowly.me/presences/<slug>/assets/{logo.png,icon.png,thumbnail.jpg}`, `<slug>` = presence folder name lower-cased, spaces to dashes (`shared/presence-assets.ts`).
- Presences are translated unevenly: most ship `en-US`/`fr-FR`/`es-ES`, some (Nowly, Product Hunt) all 11 site locales. Metadata falls back to `en-US` (`lib/presence-view.ts`); the language sent to Discord is resolved by `shared/presence-language.ts` (global choice, else saved per-presence choice, else the interface language when the presence ships it, else `en-US`), used by both the runtime and the UI so they never disagree. Changing the interface language re-sends presence strings (`refreshPresenceLanguage`).
- The global "Discord language" only lists the locales every installed presence ships (`lib/presence-locales.ts`, presences without `locales` are ignored); the other ones are chosen per presence. A saved global locale that a newly installed presence lacks stays listed with a "missing" hint.
- Publication dates come from the API only (`GET /presences`, `/presences/:slug`, `/presences/:slug/stats`), as ISO strings or `null`: `addedAt` = first successful publication, never moved by republications (equals `lastUpdated` for a new presence); `lastUpdated` = latest successful publication. They are normalised once in `shared/presence-catalog.ts`. Never substitute local dates (`StoredPresence.installedAt`, cache or download times) or CDN/R2 upload times, and never read the API's internal `updatedAt`.
- UI wording: "Published" = `addedAt`, "Last updated" = `lastUpdated` (shown only when later than `addedAt`), "Added on" = local `installedAt` (matches the "Add" install button). Installed catalog rows show "Manage", which opens the presence page.
