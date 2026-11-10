# Background (service worker)

## Add a router message

1. `NAME: { payload; response }` in `RouterMessageMap` (`router/contracts.ts`).
2. `handleName: Handler<"NAME">` in the matching `router/handlers/*.handlers.ts` (`extra.handlers.ts` for side-panel-only needs).
3. Register it in `buildHandlerRegistry` (`router/handlers/index.ts`); a missing handler is a compile error.
4. Add it to `preview/mock-router.ts` if the preview needs it.

## Rules

- The worker dies after about 30 s idle: state that must survive (tab presences, active slugs and sessions, muted tabs, site timers, the Discord IPC episode, open editors) lives in `chrome.storage.session`, never in module memory. Multi-key updates are single read-modify-write passes. Installed-presence writes run through the serialized transaction in `storage/presences.store.ts`; keep external downloads and device sync outside it, and never start another installed-presence mutation from inside a transaction.
- The install queue serializes storage and alarm changes. A drain can run only once at a time and retires just the generations it completed, so requests made during a download stay queued.
- Boot runs once (`bootBackground` memoises its promise); the router returns `true` from `onMessage` while handlers await.
- Re-validate native status with a `PING` on every `GET_NATIVE_STATUS`; retiring a port resets every connection field together. Explicit reconnect and restart wait for a `PONG` from the current port or its disconnect, with a timeout slightly above the host's Discord handshake deadline.
- Empty `catch {}` blocks are kept only where the failure is expected and harmless: unregistering a user script that is not registered, disconnecting an already closed native port, the context menu catalog lookup (falls back to opening the store), the announcements `EventSource` (polling covers it). Anything else logs through `addRuntimeLog`.
- Release verification is fail-closed (bundle SHA-256, metadata hash, ECDSA P-256 signature in `services/release-security.ts`); unsigned releases are accepted on canary builds only. A build whose `API_BASE_URL` is the production API verifies against the embedded key alone and never fetches or reads a cached key: a key served by the API is only as trustworthy as the releases it serves. Only builds pointed at another API fetch `/security/public-key`. Rotating the production key therefore needs an extension release that embeds the new key first.
- Presence runtime messages (`runtime/presence-runtime-bridge.ts`) arrive through `window.postMessage`, which any page can call: `isPresenceSender` accepts one only when the sender tab URL matches the URL patterns of that presence (iframe scripts post to `window.top`, so the top page is the sender). Never handle `ACTIVITY_UPDATE`, `CLEAR_ACTIVITY` or `DEBUG` from this source without that check.
- Telemetry (`background/telemetry.ts`) is opt-in and dropped until consent is `true` (canary also needs `developerMode`). Never send device IDs, activity content, slugs or real URLs.
- Runtime logs strip privacy-sensitive keys (`url`, `title`, `query`, `discordId`...) before storing (`runtime-logs.ts`).
- `chrome.sidePanel.open()` must run in the user-gesture turn: never `await` before it.
- `chrome.userScripts` exists only once "Allow user scripts" is on and fires no event: the side panel sends `SYNC_PRESENCE_SCRIPTS` when it sees the status flip. Firefox requests the permission from the onboarding (user gesture).
- The nowly.me web protocol defines its own message names in `@nowly/shared/web-bridge-protocol`. The extension derives the background allowlist in `shared/web-bridge-routing.ts`: `GET_INSTALLED` maps to `GET_PRESENCES` and `GET_DEVICE_INFO` is handled by the content script. Web messages also need an allowlisted sender URL.
- Creator messages (`CREATOR_*`, `router/handlers/creator.handlers.ts`) target the focused tab (`services/focused-tab.ts`) and reach the picker in the content script; a tab loaded before the extension has no content script, so they answer `UNREACHABLE`. `CREATOR_TEST_ACTIVITY` posts straight to the native host and `broadcastActiveTab()` restores the real activity when the test stops (`managers/creator-test.ts`).
- Creator submissions reuse the account token (`services/creator-api.ts`) and need its explicit `creator` scope and a Discord id, like public activities; sign-in goes through `START_CREATOR_CONNECT`.
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
