# Legal

Rendered by `app/[locale]/legal-notice`, `/cookies`, `/privacy`, `/tos`, `/consent`: `legal-view.tsx` (shared layout), `legal-html.tsx` (renders each page's static content).

## Add a new legal document

1. Create the route under `app/[locale]/<new-slug>/page.tsx`, mirroring an existing one (e.g. `app/[locale]/privacy/page.tsx`).
2. Have it render `<LegalView>`/`<LegalHtml>` from this feature, passing the page's translated content — don't build a new layout, reuse `legal-view.tsx`.
3. Add the new page's content/translations to all 11 locale files.
4. If it should appear in the footer's legal links, follow `packages/ui/AGENTS.md`'s "Add a link to the footer" steps (the legal links live in `legalLinks`, not `columns`).

## Notable dependencies

The extension discovers document updates through `GET /api/legal/versions`. Its source of truth is `packages/shared/src/legal.ts`. Increment the edited document's `version` and `updatedAt` with every publication; for significant changes requiring a new confirmation, set `requiredVersion` to that version as well. Publish the manifest and all localized document edits together. The extension records ToS acceptance separately from privacy acknowledgement, locally on each device and independently from analytics consent.

Privacy and terms cover custom activity uploads and JSON sharing in all 11 locales. Keep local RPC transmission distinct from remote image storage. Uploads work without an account or analytics consent, use device authentication and Cloudflare R2, and expose public URLs. Do not promise private storage, EU-only image processing, automatic moderation or exact deletion after 30 days: cleanup must run successfully, active use renews retention, and third-party caches/shared files may persist. Account deletion or uninstall is not device-image erasure. Confirm deployment, transfer safeguards and cleanup scheduling before release, and obtain legal review of the published wording. `legal-content.test.ts` checks localized disclosure coverage.
`lib/constants.ts`, `lib/brand.ts` (root, shared). `packages/ui`'s `footer.tsx` for the legal-links row.
