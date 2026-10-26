# Background

MV3 service worker: message router, presence lifecycle, native host bridge, presence script injection, API sync.

## Add a router message

1. Add `NAME: { payload; response }` to `RouterMessageMap` in `router/contracts.ts`.
2. Implement `handleName: Handler<"NAME">` in the matching `router/handlers/*.handlers.ts` (`extra.handlers.ts` for side-panel-only needs).
3. Register it in `buildHandlerRegistry` (`router/handlers/index.ts`).
4. If the preview should support it, add it to `preview/mock-router.ts` (typed against the same map).

## Gotchas

- The worker is killed after ~30s idle. Anything that must survive a respawn while tabs stay open (tab presences, active slugs, active sessions, muted tabs) lives in `chrome.storage.session`, never in module memory (`services/background-context.ts`). Multi-key updates are single read-modify-write passes; concurrent per-slug writes race.
- `preserveSiteTimer` is opt-in. `services/site-timers.ts` stores one elapsed start per presence slug in `chrome.storage.session.siteTimers`, shared across tabs until the browser session ends or the option changes. It only transforms the broadcast payload; tab entries keep original timestamps so disabling restores them. Finite playback timelines and play/pause badges are excluded. A tab remembers a playback timeline for the same content (first button URL, else name/details/state) when paused updates omit timestamps and badges. Timer writes are serialized; the in-memory promise is only a lock. No URLs or titles are stored in the timer cache or synced.
- `onStartup`, `onInstalled` and module load can fire in the same tick: `bootBackground` memoises its promise so boot runs once (`services/lifecycle.ts`).
- The router returns `true` from `onMessage` to keep the response channel open while handlers await (`router/router.ts`).
- Native status is re-validated with a `PING` on every `GET_NATIVE_STATUS` because the worker may have slept; a disconnect resets every connection field together (`services/native.ts`).
- The Discord IPC access-denied episode (`shared/discord-ipc-prompt.ts`) lives in `chrome.storage.session` (`discordIpcIssue`). It is reported on `NativeStatus` (`code`, `codePrompted`) only while the host is connected; a disconnect hides it without ending the episode.
- Release verification is fail-closed: bundle SHA-256 + metadata hash + ECDSA P-256 signature. Key rotation tries the cached key, then the bundled fallback, then refreshes once. Unsigned releases are accepted on canary builds only (`services/release-security.ts`).
- `@nowly/shared` provides `canonicalJson`, which must stay byte-identical to the API's, or every hash and signature check fails.
- Runtime logs strip privacy-sensitive payload keys (`url`, `title`, `query`, `discordId`...) before storing (`runtime-logs.ts`).
- Chrome exposes `chrome.userScripts` only once "Allow user scripts" is on and fires no event when toggled; the side panel sends `SYNC_PRESENCE_SCRIPTS` when it sees the status flip. On Firefox it is an optional permission requested from the onboarding (user gesture required).
- `chrome.sidePanel.open()` must run in the same user-gesture turn: never `await` before it (`services/open-panel.ts`).
- The context menu has no "about to show" event, so the mute item is re-synced on every broadcast (`services/context-menu.ts`).
- Failed installs with 408/429/5xx/network errors are queued and retried every minute (`managers/install-queue.ts`).

## Privacy and network

- Presence activity goes only through `postNative`. API calls carry slug, version and `deviceId` only.
- Analytics use `@nowly/analytics` (`analytics-client.ts`). Events are dropped until consent is `true` (`getAnalyticsConsent`, default `false`); unknown payload keys are rejected by the API.
- Active heartbeat (`services/active-heartbeat.ts`): `POST /presences/active` with `{ presences, deviceId }`, sent on the `api-heartbeat` alarm while slugs are active and when an activity starts (`managers/activity-manager.ts`). It does not depend on analytics consent. `DELETE /presences/active` retries once so a blip does not leave a device "active" until the server's 12 min TTL.

## Legal gate

- `legalDocumentsPending` (`services/legal-documents.ts`) is true while any document lacks a receipt at its `requiredVersion`. Activity broadcast/resume (`managers/activity-manager.ts`) and custom activity activation and image uploads (`managers/custom-activity-manager.ts`) stop while it is true. See `features/legal/AGENTS.md`.
- The `legal-documents-check` alarm (hourly, registered in `registerLifecycleHandlers`, `services/lifecycle.ts`) runs `checkLegalDocuments` then `broadcastActiveTab`.

## Web protocol (`content/index.ts`)

- Only messages in `WEB_MESSAGE_TYPES` are relayed to the router, and only from an allowed origin (`isAllowedWebOrigin`: the nowly.me origin, plus `localhost:3000`/`127.0.0.1:3000` in canary builds). Keep the origin check strict; add a type to the set only when the page needs it.
- Web names are kept; only `GET_INSTALLED` is translated to `GET_PRESENCES`. Answers are `<TYPE>_RESULT` (`INSTALLED_PRESENCES` for `GET_INSTALLED`).
- `GET_DEVICE_INFO` answers `{ deviceId, deviceToken }`; the token is read from `chrome.storage.local` and never forwarded elsewhere.
- `NOWLY_SESSION` (from `nowly.me/extension/connect`) answers `NOWLY_SESSION_RESULT`.

## Account sync

- `services/account-sync.ts` orchestrates, `services/account-sync-local.ts` reads and applies local values, `services/account-api.ts` talks to `/me`, `/sync*`, `/devices/:deviceId/link` and `/extension/tokens/current` with `Authorization: Bearer <nxt_ token>`. State in `chrome.storage.local`: `account` (token, user) and `syncState` (per key: last synced `version` and `base`, `cursor` = previous `serverTime`, `lastSyncedAt`, `error`, `pendingChoice`, `pendingPresences`).
- Triggers: boot, the `account-sync` alarm (5 min), `SYNC_ACCOUNT` when the panel opens, and any change of `settings`, `presences`, `presenceSettings` or `featureReveals` in storage (3 s debounce, push only). Runs are serialized (`runAccountSync` queues one follow-up); a push identical to `base` makes no request, so applying a remote value never loops.
- First sync (`cursor === null`): empty account, identical data, or a device without presences and presence settings adopts and uploads silently. Otherwise set `pendingChoice` and wait for `RESOLVE_SYNC_CHOICE` (`account`: apply the account's documents, `device`: overwrite them with `baseVersion` = their current version). Nothing syncs while a choice is pending.
- Pull uses `GET /sync/changes?since=<cursor>` and takes only documents with a higher version. Push uses `PUT /sync/:key` with `baseVersion`; a `409` merges with the returned value, applies it locally and retries (3 attempts).
- Presences from another device go through `installPresenceFromApi` (same verification and install queue as the library). Until installed they stay in `pendingPresences` so they are not seen as uninstalled; `reconcilePendingPresences` applies `enabled`, `schedule` and `installedAt` once installed.
- `401` from any sync call signs out locally (account and sync state removed, local data kept). Network or server errors only set `error`; the next trigger retries.
- `STOP_ACCOUNT_SYNC` calls `DELETE /sync`, which also revokes every token of the account on the server, then signs out locally.

## Notable dependencies

`shared/` (types, constants, URL patterns, analytics catalog), Nowly API (`/presences`, `/devices`, `/insights/events`, `/security/public-key`), native host `nowly.client`.
