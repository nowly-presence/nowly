# Legal documents

`LegalGate` wraps the app before onboarding. It requests cached state first, then checks the public web manifest. The blocking dialog records ToS acceptance and privacy acknowledgement separately. Neither choice enables analytics.

Versions live in `packages/shared/src/legal.ts`, shared with `GET /api/legal/versions` on nowly.me. For every published document edit, increment its `version` and update `updatedAt`. For a significant change requiring confirmation, also set `requiredVersion` to the new `version`. Never decrease either version. Update the document translations in the same deployment. Deploy the website first; existing extensions discover the update without an extension release.

The worker checks at startup and hourly, with a persisted one-hour cache and five-minute retry backoff. Offline use retains the bundled or newest cached manifest and receipts. Changes are compared per document, never with a global timestamp. Confirmation rejects stale versions if a check completes while the dialog is open.

Receipts and manifest live only in `chrome.storage.local.legalDocuments`, not account sync. The broadcast/resume paths and image uploads stop while required confirmations are pending. The dialog has no dismiss action; Escape does not record acceptance or bypass confirmation. The footer contains only the primary confirmation button and the optional analytics note. Document versions are internal; only update dates are displayed. Do not add badges or redundant explanatory copy.

Preview: `?legal=first` and `?legal=update`; other previews default to acknowledged documents. Final screenshots must use the built extension loaded in Chromium, not these fixtures.
