# Legal documents

`LegalGate` (`legal-gate.tsx`) wraps the app in `app.tsx`, before onboarding. It requests cached state first, then checks the public web manifest. The blocking dialog records ToS acceptance and privacy acknowledgement separately. Neither choice enables analytics (consent lives only in the onboarding privacy step and Settings).

## Versioning

- Versions live in `packages/shared/src/legal.ts`, shared with `GET /api/legal/versions` on nowly.me. Each document has `version`, `requiredVersion` (`requiredVersion <= version`) and `updatedAt`.
- For every published edit, increment `version` and update `updatedAt`. Only for a significant change requiring confirmation, also set `requiredVersion` to the new `version`. Never decrease either.
- A receipt is valid while its version is at least `requiredVersion` (`pendingLegalDocuments`). Example: ToS at `version: 2` with `requiredVersion: 1` still accepts a receipt for version 1; it is not asked again.
- Update the document translations in the same deployment. Deploy the website first; existing extensions discover the update without an extension release.

## Behavior

- The worker checks at startup and hourly (`legal-documents-check` alarm), with a persisted one-hour cache and five-minute retry backoff. Offline use keeps the bundled or newest cached manifest and receipts. Changes are compared per document, never with a global timestamp. Confirmation rejects stale versions if a check completes while the dialog is open.
- Receipts and manifest live only in `chrome.storage.local.legalDocuments`, never in account sync. While confirmations are pending, the background stops activity broadcast/resume and image uploads (`legalDocumentsPending`).
- The dialog has no dismiss action; Escape does not record acceptance or bypass confirmation. The footer holds only the primary confirmation button and the optional analytics note. Document versions are internal; only update dates are displayed. No badges or redundant explanatory copy.

## Preview

`?legal=first` and `?legal=update`; other previews default to acknowledged documents. Final screenshots must use the built extension loaded in Chromium, not these fixtures.
