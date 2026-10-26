# Legal documents

`LegalGate` wraps the app before onboarding. It requests cached state first, then checks the public document dates. The blocking dialog records ToS acceptance and privacy acknowledgement separately. Neither choice enables analytics.

The dates come directly from `tos-page.last-updated` and `privacy-page.last-updated` in the website messages, exposed by `GET /api/legal/versions` as `{ tos, privacy }`. There is no separate manifest or version counter. For a published document change, advance its ISO date (`YYYY-MM-DD`) and update the translations together. Any changed document date requires its own new confirmation. Never decrease a published date. The extension retains the last fetched dates for offline use; a fresh installation needs one successful fetch before confirmation is possible. Older version-based receipts are not converted and require a one-time confirmation after this transition. Coordinate the first website/extension release because the endpoint's response shape changes; subsequent document updates need only a website deployment.

The worker checks at startup and hourly, with a persisted one-hour cache and five-minute retry backoff. Offline use retains the newest cached dates and receipts; there is no bundled fallback. Changes are compared per document, never with a global timestamp. Confirmation rejects stale dates if a check completes while the dialog is open.

Receipts and dates live only in `chrome.storage.local.legalDocuments`, not account sync. The broadcast/resume paths and image uploads stop while required confirmations are pending. The dialog has no dismiss action; Escape does not record acceptance or bypass confirmation. The footer contains only the primary confirmation button and the optional analytics note. Only document update dates are displayed. Do not add badges or redundant explanatory copy.

Preview: `?legal=first` and `?legal=update`; other previews default to acknowledged documents. Final screenshots must use the built extension loaded in Chromium, not these fixtures.
