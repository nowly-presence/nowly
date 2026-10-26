# Ads (Google AdSense)

Everything is off unless the build sets these variables. `NEXT_PUBLIC_*` values are inlined at build time, so they are Dockerfile ARGs (`apps/web/Dockerfile`). Config is read only in `lib/adsense.ts`.

| Variable | Effect |
| --- | --- |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | `ca-pub-<10-20 digits>` (malformed = unset). Adds the `google-adsense-account` meta tag on every page and serves `/ads.txt`. No script, no cookie. |
| `NEXT_PUBLIC_ADSENSE_ENABLED` | `true` lets `AdSlot` render ad units. |
| `NEXT_PUBLIC_ADSENSE_GUIDES_SLOT` | Numeric ad unit ID (5-20 digits) for the `guides` placement. |

The Dockerfile also declares `NEXT_PUBLIC_ADSENSE_LANDING_SLOT`, but no code reads it (the only placement is `guides`). Don't rely on it.

## Rules

- `AdSlot` (server) returns `null` unless enabled, the client ID is valid and the placement has a valid slot ID. Only then does `AdUnit` (client) load `adsbygoogle.js`, so pages without a slot never load Google's script.
- Placement: general guide articles only (`<AdSlot placement="guides" />` in `app/[locale]/guides/[slug]/page.tsx`, after the main content). Never presence pages, library listing, home, `/desktop`, `/extension`, `/canary`, legal or account pages. Adding a placement means extending `AdPlacement` and `SLOTS` in `lib/adsense.ts` and the Dockerfile ARG/ENV.
- In the EEA, UK and Switzerland, Google's own consent message appears once the "European regulations" message is published in AdSense. The site's `cookie-banner` (a localStorage notice) does not replace it.
- The "Advertising" section of `cookies-page` (`messages/*.json`) carries the required disclosures (third-party vendors including Google use cookies from previous visits; links to Google Ads Settings, aboutads.info and Google's partner-sites page) and names guide articles as the sole placement; `aboutPage` names it too. Update all 11 languages if the placement changes.
- Before enabling ads, re-read `privacy-page` (processors) and `cookie-banner`, and bump `last-updated` on any legal page you change.
