# Library

`/library`, `/library/<slug>` (metadata aliases redirect to the slug) and `/author/<github>`.

- New category: add it to `LIBRARY_CATEGORIES` (`lib/library-catalog.ts`), to the `category` enum of the presences repository's `metadata.schema.json` and the SDK `Metadata` type, and `categories.<key>` to `libraryPage` in all 11 locales. A category missing from `LIBRARY_CATEGORIES` still validates but gets no filter.
- Presence actions are assembled in `presence-actions.tsx`, except the like button (`LibraryMedia` `action` slot, top-right of the thumbnail). Install state shows one primary action: Install, Remove when up to date, Update and Remove when outdated. No "Installed" badge button.
- Dialogs follow `presence-report-dialog.tsx`; requests go through `lib/presence-api.ts`, never an inline `fetch`.
- Presence success events come only from the extension background, never from a web conversion event.
- `getPresenceBySlug` resolves aliases and `presenceSearchText` indexes every localized description and alias.
- hreflang and sitemap: `presenceIndexLocales` keeps only locales with a translated description (or presence guide); the others canonicalize to English.
- No ads on presence pages or the listing.
