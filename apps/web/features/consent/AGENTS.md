# Consent

`app/[locale]/consent` renders `components/consent-view.tsx`: manage analytics consent and the device's data. It needs the extension; without it the page shows a "not detected" card.

## How it works

- Extension bridge (`lib/extension-bridge.ts`): `GET_DEVICE_INFO` (`{ deviceId, deviceToken }`), `GET_ANALYTICS_CONSENT`, `SET_ANALYTICS_CONSENT` (`{ granted }`). Consent is stored by the extension, not the site.
- API (`presenceApiBaseUrl()` from `lib/presence-api-client.ts`), authenticated with `X-Device-Token` when a token exists: `GET /devices/:id/export` (downloads `nowly-my-data.json`) and `DELETE /devices/:id` (behind `window.confirm`).
- `lib/analytics.ts` (`trackPublicAnalytics`) is a separate, website-side client with `alwaysGrantedConsent`; it does not read this page's toggle. Keep payloads within the root privacy rules.
- `features/layout/components/cookie-banner.tsx` is not a consent mechanism: it is a dismissible notice stored in `localStorage` (`nowly_cookie_dismissed`).

## Add a consent category

1. Define it in `packages/analytics` and in the extension handlers (`GET/SET_ANALYTICS_CONSENT` payloads and `ExtensionRequestType` in `lib/extension-bridge.ts`).
2. Add a toggle/section in `consent-view.tsx` and its `consentPage` messages in all 11 locales.

## Notable dependencies
`lib/extension-bridge.ts`, `lib/presence-api-client.ts`, `packages/analytics`.
