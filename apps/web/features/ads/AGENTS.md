# Ads (Google AdSense)

Everything is off unless the build has the environment variables below (`NEXT_PUBLIC_*` values are inlined at build time, so they are Dockerfile ARGs).

| Variable | Effect |
| --- | --- |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | `ca-pub-...`. Adds the `google-adsense-account` meta tag on every page and serves `/ads.txt`. No script, no cookie. This is all AdSense needs to review the site. |
| `NEXT_PUBLIC_ADSENSE_ENABLED` | `true` lets `AdSlot` render ad units. |
| `NEXT_PUBLIC_ADSENSE_GUIDES_SLOT` | Ad unit ID for guide articles. |

## Rules

- `AdSlot` (server) returns `null` unless enabled and the placement has a numeric slot ID. Only then does `AdUnit` (client) load `adsbygoogle.js`, so pages without a slot never load Google's script.
- Placements: general guide articles only, after the main content. Never presence pages, the library listing, the home page, `/desktop`, `/extension`, `/canary`, legal pages or account pages.
- The AdSense script shows Google's own consent message in the EEA, UK and Switzerland once the "European regulations" message is published in AdSense (Privacy & messaging). The site's cookie banner does not replace it.
- The "Advertising" section of `cookies-page` (`messages/*.json`) carries the disclosures AdSense requires: third-party vendors including Google use cookies based on previous visits, and links to Google Ads Settings, aboutads.info and Google's partner-sites page. It names general guide articles as the sole placement; update all 11 languages if the placement changes. `aboutPage` names it too.
- Before enabling ads, re-read `privacy-page` (processors) and `cookie-banner` and bump `last-updated` on any legal page you change.
