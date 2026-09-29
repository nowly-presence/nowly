# Background

MV3 service worker: message router, presence lifecycle, native host bridge, presence script injection, API sync. Ported from the monorepo's `apps/extension/src/background`; keep it structurally identical so the two stay diffable.

## Add a router message

1. Add `NAME: { payload; response }` to `RouterMessageMap` in `router/contracts.ts`.
2. Implement `handleName: Handler<"NAME">` in the matching `router/handlers/*.handlers.ts` (`extra.handlers.ts` for side-panel-only needs).
3. Register it in `buildHandlerRegistry` (`router/handlers/index.ts`).
4. If the preview should support it, add it to `preview/mock-router.ts` (typed against the same map).

## Gotchas

- The worker is killed after ~30s idle. Anything that must survive a respawn while tabs stay open (tab presences, active slugs, active sessions, muted tabs) lives in `chrome.storage.session`, never in module memory (`services/background-context.ts`). Multi-key updates are single read-modify-write passes; concurrent per-slug writes race.
- `onStartup`, `onInstalled` and module load can fire in the same tick: `bootBackground` memoises its promise so boot runs once (`services/lifecycle.ts`).
- The router returns `true` from `onMessage` to keep the response channel open while handlers await (`router/router.ts`).
- Native status is re-validated with a `PING` on every `GET_NATIVE_STATUS` because the worker may have slept; a disconnect resets every connection field together (`services/native.ts`).
- Release verification is fail-closed: bundle SHA-256 + metadata hash + ECDSA P-256 signature. Key rotation tries the cached key, then the bundled fallback, then refreshes once. Unsigned releases are accepted on canary builds only (`services/release-security.ts`).
- `@nowly/shared` provides `canonicalJson`, which must stay byte-identical to the API's, or every hash and signature check fails.
- Analytics use `@nowly/analytics`. Events are opt-in and dropped until consent is `true`; unknown payload keys are rejected by the API.
- Runtime logs strip privacy-sensitive payload keys (`url`, `title`, `query`, `discordId`...) before storing (`runtime-logs.ts`).
- Chrome exposes `chrome.userScripts` only once "Allow user scripts" is on and fires no event when toggled; the side panel sends `SYNC_PRESENCE_SCRIPTS` when it sees the status flip. On Firefox it is an optional permission requested from the onboarding (user gesture required).
- `chrome.sidePanel.open()` must run in the same user-gesture turn: never `await` before it (`services/open-panel.ts`).
- The context menu has no "about to show" event, so the mute item is re-synced on every broadcast (`services/context-menu.ts`).
- Failed installs with 408/429/5xx/network errors are queued and retried every minute (`managers/install-queue.ts`); `DELETE /presences/active` retries once so a blip doesn't leave a device "active" until the server's 12 min TTL.
- The nowly.me web protocol keeps its own message names; only `GET_INSTALLED` is translated to `GET_PRESENCES` (`content/index.ts`).

## Notable dependencies
`shared/` (types, constants, URL patterns, analytics catalog), Nowly API (`/presences`, `/devices`, `/insights/events`, `/security/public-key`), native host `nowly.client`.
