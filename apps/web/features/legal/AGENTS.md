# Legal

`legal-view.tsx` (shared layout) and `legal-html.tsx` (renders a page's static content) back `app/[locale]/legal-notice`, `/cookies`, `/privacy` and `/tos`. `/consent` is not rendered here: it is `features/consent`.

## Add a legal document

1. Create `app/[locale]/<slug>/page.tsx`, mirroring `app/[locale]/privacy/page.tsx`.
2. Render `<LegalView>`/`<LegalHtml>` with the translated content; don't build a new layout.
3. Add the content/translations to all 11 locale files.
4. To list it in the footer, follow "Add a link to the footer" in `packages/ui/AGENTS.md` (legal links live in `legalLinks`, not `columns`).

## Versioning

The extension discovers document updates through `GET /api/legal/versions` (`app/api/legal`), whose source of truth is `packages/shared/src/legal.ts`. With every publication, increment the edited document's `version` and `updatedAt`; for a significant change needing re-confirmation, also set `requiredVersion` to that version. Publish the manifest and all localized edits together. The extension records ToS acceptance and privacy acknowledgement separately, locally per device, independently of analytics consent.

## Custom activity uploads

Privacy and terms cover custom activity uploads and JSON sharing in all 11 locales. Keep local RPC transmission distinct from remote image storage. Uploads work without an account or analytics consent, use device authentication and Cloudflare R2, and expose public URLs. Do not promise private storage, EU-only image processing, automatic moderation or exact deletion after 30 days: cleanup must run successfully, active use renews retention, and third-party caches or shared files may persist. Account deletion or uninstall is not device-image erasure. Confirm deployment, transfer safeguards and cleanup scheduling before release, and get legal review of the wording. `legal-content.test.ts` checks localized disclosure coverage.

## Notable dependencies
`lib/constants.ts`, `lib/brand.ts`, `packages/shared/src/legal.ts`, `packages/ui` footer.
