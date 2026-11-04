# Creator drafts

Per-account storage of presence creator drafts so they follow the user across devices. Routes `/me/creator-drafts` need an extension token with the `creator` scope. Last writer wins on the draft's own `updatedAt` (stale writes get 409 `DRAFT_CONFLICT`); deletion writes a tombstone row so older edits cannot revive a draft. Limits: 20 live drafts, 3 MB per draft. Rows cascade with the user.
