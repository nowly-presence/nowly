# Background (service worker)

## Add a router message

1. `NAME: { payload; response }` in `RouterMessageMap` (`router/contracts.ts`).
2. `handleName: Handler<"NAME">` in the matching `router/handlers/*.handlers.ts` (`extra.handlers.ts` for side-panel-only needs).
3. Register it in `buildHandlerRegistry` (`router/handlers/index.ts`); a missing handler is a compile error.
4. Add it to `preview/mock-router.ts` if the preview needs it.

## Rules

- The worker dies after about 30 s idle: state that must survive (tab presences, active slugs and sessions, muted tabs, site timers, the Discord IPC episode, open editors) lives in `chrome.storage.session`, never in module memory. Multi-key updates are single read-modify-write passes.
- Boot runs once (`bootBackground` memoises its promise); the router returns `true` from `onMessage` while handlers await.
- Re-validate native status with a `PING` on every `GET_NATIVE_STATUS`; a disconnect resets every connection field together.
- Release verification is fail-closed (bundle SHA-256, metadata hash, ECDSA P-256 signature in `services/release-security.ts`); unsigned releases are accepted on canary builds only.
- Telemetry (`background/telemetry.ts`) is opt-in and dropped until consent is `true` (canary also needs `developerMode`). Never send device IDs, activity content, slugs or real URLs.
- Runtime logs strip privacy-sensitive keys (`url`, `title`, `query`, `discordId`...) before storing (`runtime-logs.ts`).
- `chrome.sidePanel.open()` must run in the user-gesture turn: never `await` before it.
- `chrome.userScripts` exists only once "Allow user scripts" is on and fires no event: the side panel sends `SYNC_PRESENCE_SCRIPTS` when it sees the status flip. Firefox requests the permission from the onboarding (user gesture).
- The nowly.me web protocol keeps its own message names (only `GET_INSTALLED` maps to `GET_PRESENCES`, `content/index.ts`). Web messages need an allowlisted sender URL and the web-specific message allowlist.
- Site timers (`preserveSiteTimer`, `services/site-timers.ts`) only transform the broadcast payload; they never store URLs or titles and never sync.

## Account sync (`services/account-sync.ts`)

- Runs are serialized. A push identical to the last synced `base` makes no request, so applying remote values never loops.
- A first sync with conflicting data sets `pendingChoice` and syncs nothing until `RESOLVE_SYNC_CHOICE`.
- `409` merges, applies locally and retries (3 attempts). `401` signs out locally and keeps local data; other errors only set `error`.
- Presences from another device install through `installPresenceFromApi` (same verification as the library) and stay in `pendingPresences` until installed.

## Public activities

- Recipient apply re-fetches the publication from the configured API, rejects another revision or fingerprint, re-checks local content, then writes under `withCustomActivityWrite`, the single queue for save, delete, activation, image refresh and editor registration.
- Keep is a no-op. Replace keeps the local id, clears detection and requires separate activation afterwards. Any open editor blocks replacement: when unsure, block.
- Publishing first reserves a revision-0 row (POST) and durably records its id and original API base before any PUT. Account switch or sign-out never clears references.
- Deletion proceeds only when every known reference matches the current API base and is either proven missing (strict 404 `NOT_FOUND` on the public endpoint, no credentials, no redirects) or withdrawn by owner CAS. `UNPUBLISHED`, outages and malformed answers block, and a blocked deletion mutates nothing. Recorded URLs are never fetched or sent tokens.
- `GET_CUSTOM_ACTIVITY_DELETION_PLAN` is a read-only preflight; it never replaces the final checks.
