# Legal

`/legal-notice`, `/cookies`, `/privacy`, `/tos` and `/consent` share `legal-view.tsx` and `legal-html.tsx`.

- New document: `app/[locale]/<slug>/page.tsx` modelled on `privacy`, rendering `LegalView`/`LegalHtml`, with its content in all 11 locales. Footer legal links live in `legalLinks` (`packages/ui/src/footer.tsx`).
- `GET /api/legal/versions` serves `tos-page.last-updated` and `privacy-page.last-updated` from `packages/locales/messages/web/en-US.json` to the extension; there is no other manifest. Keep them ISO `YYYY-MM-DD` and identical in every locale. Advance the edited document's date when publishing a change and never decrease it: each new date requires a new confirmation in the extension.
- Privacy and terms disclose custom activity uploads and JSON sharing in all 11 locales (`legal-content.test.ts` checks the coverage). Keep local RPC transmission distinct from remote image storage. Never promise private storage, EU-only processing, automatic moderation or exact deletion after 30 days, and never present account deletion or uninstall as device-image erasure. Wording changes need legal review.
