# Ads (Google AdSense)

Off unless the build sets the variables (Dockerfile ARGs, inlined at build time). Config is read only in `lib/adsense.ts`.

- `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (`ca-pub-...`) adds the account meta tag and `/ads.txt`; `NEXT_PUBLIC_ADSENSE_ENABLED=true` lets `AdSlot` render; `NEXT_PUBLIC_ADSENSE_GUIDES_SLOT` is the only placement's unit id. `NEXT_PUBLIC_ADSENSE_LANDING_SLOT` exists in the Dockerfile but nothing reads it.
- Google's script loads only when a slot actually renders (`AdSlot` returns `null` otherwise).
- The only placement is general guide articles (`<AdSlot placement="guides" />`). Never on presence pages, the library, home, `/desktop`, `/extension`, `/canary`, legal or account pages. A new placement means extending `AdPlacement` and `SLOTS` (`lib/adsense.ts`) and the Dockerfile.
- The site's cookie banner does not replace Google's EEA, UK and Swiss consent message.
- If placements change, update the advertising disclosures in `cookies-page` and `aboutPage` in all 11 locales. Before enabling ads, re-read `privacy-page` and the cookie banner, and bump `last-updated` on any legal page you change.
