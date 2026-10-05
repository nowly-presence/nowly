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
- App-wide overlay without its own screen (e.g. the one-time review prompt in `features/review/`, the Halloween prank and the season moments in `features/seasonal/`): a component mounted once at the end of `entrypoints/sidepanel/app.tsx`.
- Introducing a new feature to existing users: wrap its entry point in `<FeatureReveal id version text hint?>` (`components/shared/feature-reveal.tsx`). See "Feature reveals" below.
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

- Appearance has three modes: `system`, `light`, `dark`. `seasonalThemes` is on by default and overlays the active season on the selected theme; turning it off removes seasonal tokens and moments, in the panel and on nowly.me.
- One calendar for everyone, computed on the device's local date, no server (`shared/seasonal-themes.ts`, tested). Only fixed dates shared worldwide, nothing that moves from year to year (no Easter, no lunar date) and no national holiday (no Thanksgiving). Seasons show for about a week around their solstice or equinox: `spring` March 17-23, `summer` June 18-24, `autumn` September 19-25, `winter` December 18-26 (it also covers the end of year holidays). Events win over a season they overlap: `halloween` October 1-31 in 2026 only (`lastYear`: from 2027 there is no Halloween theme, the autumn week carries the mood and only the October 31 prank remains), `new-year` from December 31 to January 1. A period's optional `lastYear` stops it after that year. The rest of the year has no season, so the brand theme stays. `resolveSeason` is the single rule (seasonal themes enabled, then the override, then the date). Each period has `enabled`, so one can be switched off without touching the rest.
- Moment days (`moment` in `SEASON_PERIODS`): spring March 20, summer June 21, autumn September 22, winter December 21 (equinoxes and solstices, the astronomical start everyone shares), new year January 1 (countdown and fireworks first, see `features/seasonal/AGENTS.md`), Halloween October 31 (the prank, every year, with or without the Halloween theme).
- `SeasonProvider` (`hooks/season-provider.tsx`, mounted in `main.tsx`) resolves the season once the state is ready, sets `season-<id>` on `<html>`, refreshes when the panel becomes visible or focused, and re-resolves at local midnight. Read it with `useSeason()` (`season`, `seasonal`, `today`, `override`).
- A season is only a token override in `ui/tokens.css` (`.season-<id>`, `.dark.season-<id>`), never colours in components. Each season sets the base tokens plus `--season-accent` and `--season-shape`. Seasonal decor (`components/shared/seasonal-decor.tsx`, passed to `EmptyState` as `decoration`) draws the season's shapes from `components/shared/season-shapes.ts` (hand-made 24px paths: leaves, maple leaf, petal, blossom, snowflake, sparkle, sun, star, confetti; Halloween keeps its bats and pumpkin) and is hidden under reduced motion. The same paths are copied in `apps/web/features/seasonal/components/season-shapes.ts`: change both.
- Migration: `getSettings` converts stored `appearance: "seasonal"` from 2.2.1 to `appearance: "system"` with `seasonalThemes: true`. Users who had already turned seasonal themes off keep them off through `seasonalThemeMigrated`; that marker is removed after migration. Missing values otherwise default to seasonal themes on.
- Nolo: `nolo-mascot.tsx`, `nolo-paths.ts`, `src/assets/nolo/` and `ui/streaming-text.tsx` are byte-for-byte copies from the prototype, do not edit them here. Costumes wrap him instead: `CostumedNolo` (`components/shared/nolo-costumed.tsx`) with `costume` set to the season id (witch hat, party hat, bobble hat, flower, straw hat, beret with a leaf), accessory paths in `nolo-costume-paths.ts` (viewBox 512, same as Nolo; `overhang` is the share of `size` the accessory sticks out above the disc) and colours in `ui/tokens.css` (`.nolo-costume-<id>`, which also recolours the disc through `--primary`). Accessories sit on top of the head, never on the eyes: the eye whites start at y 91 (around x 320), so nothing goes below y 76 above the eyes, rotation included. To use a designer's drawing, replace that costume's `layers` and `transform`, nothing else.
- Canary developer settings have "Force the season" (`seasonOverride` in `chrome.storage.local`: a season, `none`, or removed for automatic), "Replay the Halloween prank" and "Replay the season moment". The preview takes `?season=<id>|none` (enables seasonal themes, with `theme=light|dark` selecting the base scheme), `?prank=1` and `?moment=1` (spring unless `season` says otherwise).

## Seasons on nowly.me

- The site never computes the season: the content script sends it, already resolved, through the web protocol, only on the nowly.me origin (and `localhost:3000`/`127.0.0.1:3000` in canary builds, like the rest of the protocol). Code in `content/web-season.ts` (tested), started from `content/index.ts`.
- Message: `{ source: "Nowly", type: "SEASON", payload: { season: Season | null } }`, posted with the page origin as target. It is sent when the content script starts, again when `settings` or `seasonOverride` change in `chrome.storage.local` (only if the resolved season changed), and in answer to `{ source: "Nowly", type: "GET_SEASON" }` from the page (same window, allowed origin). `null` means no theme (seasonal themes off, `none` forced, or no period today). Nothing else is ever sent with it: no device id, no other setting.
- The content script reads storage directly (`seasonalThemesEnabled` mirrors the settings migration) so the page gets an answer even while the service worker sleeps.
- On the site the theme is visual only: no prank, no Nolo, no sound. See `apps/web/features/seasonal/AGENTS.md`.

## Feature reveals

- `<FeatureReveal id="account-sync" version="2.3.0" text={t("reveal.accountSync")} hint={t("reveal.accountSyncHint")}>` wraps one element (its first child is the spotlight target, wrapped in a `display: contents` span). Dock items take a `wrap` for this; 2.3.0 wraps the Settings tab.
- Flow: the screen is dimmed and blurred (`bg-tertiary/40`, `dark:bg-overlay/65`) with a rounded hole around the target (`clip-path: path(evenodd)`, so the target stays clickable) and a callout with "Skip". Clicking the target opens the explanation: Nolo springs in and opens a speech bubble that streams `text` (`ui/streaming-text.tsx`, tap to finish), then "Got it". Skip, Got it and Escape all mark it seen.
- It shows once per `id` (`featureReveals` in `chrome.storage.local`, `shared/feature-reveal.ts`), only on the release line of `version` (same major.minor, patch >= its patch), after onboarding, with no pushed route. `FeatureRevealProvider` (mounted in `app.tsx`) shows one reveal at a time in mount order; the review prompt, the Halloween prank and the season moments wait until none is active. `featureReveals` is synced with the account, so a reveal seen on one device is not shown again on another.
- `feature-reveal.tsx`, `feature-reveal-overlay.tsx`, `hooks/feature-reveal-provider.tsx` and `shared/feature-reveal.ts` (with its test) come from the prototype. The only local change: the overlay draws `CostumedNolo` with the active season's costume (witch hat in October, bobble hat in winter...), like the Halloween prank.
- Canary builds have "Replay Nolo" in developer settings: it clears `featureReveals` and ignores the version rule for the rest of the session, so Nolo comes back on any version. The preview takes `?reveal=1`.
- Nolo (`components/shared/nolo-mascot.tsx`) appears in feature reveals, the Halloween prank and the season moments, nowhere else (not in empty states or other screens, per review). The disc uses `--primary` so it follows the theme, "eye down" is the vertical mirror of "eye up" (`gaze` prop). He blinks and looks around, and pulses slightly while `talking` (no idle floating: rejected in review); all of it is off under reduced motion. Animations use `motion` (`motion/react`).

## Account and sync (2.3.0)

- Optional and discreet: no banner, nothing in the onboarding, nothing blocks without an account. The only entry point is the "Account and sync" section in Settings (`features/settings/sections/account-section.tsx`), announced once by the `account-sync` feature reveal.
- Sign-in opens `nowly.me/extension/connect?source=extension&device=<deviceId>`. The page sends `NOWLY_SESSION` through the web protocol (`content/index.ts`); the background checks the token with `GET /me`, stores it (`background/storage/account.store.ts`), links the device (`POST /devices/:deviceId/link`) and starts a first sync.
- Synced keys: `settings` (only `SYNCED_SETTINGS_KEYS`: never `customApiBaseUrl`, `developerMode`, `presencePaused` or anything device-specific), `presences` (`{ slug, enabled, schedule?, installedAt }` of store presences; bundles are downloaded again, local zips and bundled presences are never synced), `presenceSettings` and `featureReveals`. Never the current activity, tabs, URLs or history. `customActivities` is accepted by the API but not sent before 2.4.0.
- Projection and merge are pure functions in `shared/account-sync.ts` (tested): three-way merge per key against the last synced value, field by field for objects, local wins on a real conflict, presences merged by slug, feature reveals as a union.
- The background flow lives in `background/services/account-sync.ts` (tested); see `background/AGENTS.md`.
- UI: `state.account` (`AccountSnapshot`) in `useExtensionState`; messages `GET_ACCOUNT`, `START_ACCOUNT_CONNECT`, `SYNC_ACCOUNT`, `RESOLVE_SYNC_CHOICE`, `SIGN_OUT_ACCOUNT`, `STOP_ACCOUNT_SYNC`. Opening the panel triggers a silent `SYNC_ACCOUNT`. The first-sync choice sheet (`features/settings/account-choice-sheet.tsx`) is mounted in `app.tsx` and reachable again from the account section.
- The preview takes `?account=out|in|choice|error`.

## Discord IPC access denied (2.3.0)

- When the native host reports `DISCORD_IPC_ACCESS_DENIED` (Discord running as administrator), a page opens once per episode and explains how to fix it on Windows. Details in `features/discord-ipc/AGENTS.md`.
- The preview takes `?native=ipc-denied`.

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
