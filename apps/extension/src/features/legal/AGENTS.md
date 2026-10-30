# Legal documents

- `LegalGate` blocks the app before onboarding until the ToS acceptance and the privacy acknowledgement (recorded separately) match the current dates from `GET /api/legal/versions`. Neither choice enables analytics.
- Each document is compared by its own date and any changed date requires a new confirmation. Confirmation rejects dates that changed while the dialog was open.
- Receipts and dates live only in `chrome.storage.local.legalDocuments`, never synced. Offline use keeps the newest cached dates; a fresh install needs one successful fetch. There is no bundled fallback.
- Broadcasting, resuming and image uploads stop while a confirmation is pending. The dialog cannot be dismissed (Escape records nothing) and its footer holds only the confirm button and the optional analytics note: no badges or extra copy.
- The error screen shows only when nothing usable is known: the stored state cannot be read, or no dates were ever fetched. A failed re-check with cached dates never blocks. "Review documents" forces a fresh fetch past the 5-minute offline backoff; "Close" closes the side panel.
- Preview: `?legal=first`, `?legal=update`, `?legal=offline` (no dates, last check failed). Final screenshots come from the built extension in Chromium, not the preview.
