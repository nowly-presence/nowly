# Activity

Home tab: live Discord card, the focused tab, other tabs reporting an activity, installed presences (list or grid).

## Add a section

1. Create `<name>-section.tsx` reading state through `useExtensionState`; return `null` when it has nothing to show.
2. Render it in `activity-view.tsx`. Derived data shared by several sections (sorted presences, live tab, detected slugs) comes from `use-activity-overview.ts`, not recomputed per section.

## Add a presence status

1. Add the variant to `PresenceStatus` and its rule to `presenceStatus` in `lib/presence-status.ts` (keep it aligned with `shouldHoldDiscord` in `background/managers/activity-manager.ts`).
2. Map it to a label and tone in `presence-status-text.ts`; add the `status.*` key to every `messages/*.json`.

## Notable dependencies
`components/shared/live-activity-card`, `hooks/use-presence-actions`, `shared/url-patterns` (catalog suggestion for the focused tab), background messages `SET_TAB_MUTED`, `GET_TAB_STATE`.
