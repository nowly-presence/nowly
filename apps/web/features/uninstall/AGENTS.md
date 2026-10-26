# Uninstall

`app/[locale]/uninstall` renders `components/uninstall-view.tsx`, the page the browser opens after the extension is removed. It offers feedback (Discord invite, reinstall button) and, when the URL has `?deviceId=` (and optionally `&token=`), a choice about the device's analytics data. It does not collect a feedback reason.

## Behavior

- With `deviceId`, on mount (once) it sends `uninstall_cleanup_received` and `uninstall_cleanup_success` through `trackPublicAnalytics` (`lib/analytics.ts`, `source: "system"`).
- "Keep my data" sends `uninstall_analytics_kept`.
- "Delete my data" asks `window.confirm`, then calls `DELETE /devices/:deviceId` (`presenceApiBaseUrl()` from `lib/presence-api-client.ts`, header `X-Device-Token` when `token` is present). Success sends `uninstall_analytics_deleted`; failure sends `uninstall_cleanup_error` with `payload: { stage: "device-delete" }`.
- Without `deviceId` the data section is hidden and nothing is tracked.

## Gotchas

- The native uninstall flow and the extension build the URL; keep the `deviceId` and `token` query names in sync with them.
- Renaming a key needs `@nowly/analytics` allowed keys checked. Don't add payload keys beyond the privacy rules in the root `AGENTS.md`.
- Messages come from the `uninstallPage` namespace (all 11 locales).

## Notable dependencies
`lib/analytics.ts`, `lib/presence-api-client.ts`, `lib/constants.ts` (`DISCORD_INVITE_URL`), `components/extension-store-button.tsx`.
