# Legal

Rendered by `app/[locale]/legal-notice`, `/cookies`, `/privacy`, `/tos`, `/consent`: `legal-view.tsx` (shared layout), `legal-html.tsx` (renders each page's static content).

## Add a new legal document

1. Create the route under `app/[locale]/<new-slug>/page.tsx`, mirroring an existing one (e.g. `app/[locale]/privacy/page.tsx`).
2. Have it render `<LegalView>`/`<LegalHtml>` from this feature, passing the page's translated content — don't build a new layout, reuse `legal-view.tsx`.
3. Add the new page's content/translations to all 11 locale files.
4. If it should appear in the footer's legal links, follow `packages/ui/AGENTS.md`'s "Add a link to the footer" steps (the legal links live in `legalLinks`, not `columns`).

## Notable dependencies
`lib/constants.ts`, `lib/brand.ts` (root, shared). `packages/ui`'s `footer.tsx` for the legal-links row.
