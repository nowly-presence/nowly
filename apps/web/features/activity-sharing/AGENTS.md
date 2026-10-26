# Shared activity page

Public route: `/activities/<32 lowercase hex id>`, with the normal site locale prefixes (for example `/fr/activities/<id>`). It is noindex. `ActivitySharingView` reads the publication using the configured API base and validates the response before rendering. Opening the page does not install, update, activate or write extension activities.

The preview follows the extension's `buildCustomPresence` and `LiveCard` rules: supported types 0/2/3/5, name placement, both text lines, image hover text, large-image brand fallback, optional small image, elapsed/countdown clock and at most two HTTPS buttons. Embedded images are displayed directly, never fetched by the server. Arbitrary external images use normal browser image requests with no referrer, not the Next image proxy.

`activity-preview.ts` owns pure layout/image/clock rules and tests. `ActivitySharingActions` owns explicit install, keep and replace choices. The existing JSON import/export feature is independent.

Keep exactly one recipient action in the frame footer: install, disabled up-to-date, or an update dialog trigger. Keep/replace choices belong in that dialog, never alongside the explanatory footer copy. Opening or cancelling the dialog performs no writes. Preserve the reviewed fingerprint and explicit replacement protections. Success/error feedback belongs inside the frame (and inside the open dialog on failure), not below it.

The public preview follows the homepage hero cards' layout: artwork at the left, text and timer at the right. Activity buttons occupy full-width rows below both columns. Keep a responsive flow rather than the hero carousel's fixed-aspect positioning so arbitrary shared content remains readable. A dark preview sits inside the padded neutral card frame, which groups explanatory copy and the explicit recipient action with standard button variants. Attribution uses the localized rich author message to place an optional avatar between the sharing label and the author's name. Technical revisions remain in the review protocol, not the presentation.

## Bridge trust and review

The website sends only `{ id, revision, fingerprint }` for status and adds `{ choice, localFingerprint }` for apply. Fingerprints use shared canonical JSON and SHA-256. The extension fetches the id from its own configured API and verifies both revision and content fingerprint. Never add an activity object, arbitrary URL, account token, native profile or device token to these messages.

Window messages require the exact page origin and `event.source === window`, with the exact origin as `postMessage` target. The background independently checks the content sender's actual URL and its web message allowlist.

Status returns only install state, installed revision, modified flag and local fingerprint. Local content, local ids, provenance baselines and credentials stay inside the extension. Keep leaves both content and baseline untouched. Replace requires the reviewed local fingerprint and reviewed public revision, disables detection and stops only the replaced copy until explicit separate activation in Nowly. Open extension editors block replacement to protect unsaved drafts. A changed publication or copy requires another review, not a silent retry.

## Publishing permission

The editor opens `/extension/connect?source=extension&device=<id>&permission=creator`. That page explains public Discord attribution and account sync. Unlike the ordinary sync flow, it never auto-connects: the user must press Connect before a token with `sync` and `creator` is minted. Returning to the extension still requires an explicit Publish action.

## Local verification and capture

Use a disposable local API fixture returning the strict `ActivityPublication` shape for a synthetic id such as `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`. Start web with `NEXT_PUBLIC_API_BASE_URL` pointing to that local fixture. Use `/activities/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` or its normal localized URL. A fixture read proves only the preview, not production publication or installation. Installation/update evidence needs the built extension and its independently configured matching API fixture. Do not use personal browser sessions or real account credentials for captures.

Run local Next dev on `localhost` (`pnpm --filter @nowly/web exec next dev --hostname localhost --port 3000`). This checkout's Next 16 dev server treats next-intl's localhost rewrite as external when explicitly bound to `127.0.0.1`, causing a pre-existing redirect loop on all pages, including `/`. With a localhost bind, the unprefixed and `/fr/activities/<id>` routes both return HTTP 200 without redirects. No locale routing configuration change is needed for this feature.
