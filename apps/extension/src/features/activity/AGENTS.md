# Activity

Home tab: live Discord card, the focused tab, other tabs reporting an activity, installed presences (list or grid).

## Add a section

1. Create `<name>-section.tsx` reading state through `useExtensionState`; return `null` when it has nothing to show.
2. Render it in `activity-view.tsx`. Derived data shared by several sections (sorted presences, live tab, detected slugs) comes from `use-activity-overview.ts`, not recomputed per section.

## Add a presence status

1. Add the variant to `PresenceStatus` and its rule to `presenceStatus` in `lib/presence-status.ts` (keep it aligned with `shouldHoldDiscord` in `background/managers/activity-manager.ts`).
2. Map it to a label and tone in `presence-status-text.ts`; add the `status.*` key to every `messages/*.json`.

## Gotchas

- The support card (`support-card.tsx`, last item of the tab) asks for a donation, never as an overlay. `shouldShowSupportCard` (`shared/support-prompt.ts`, tested) is the single rule: not during onboarding, not while an activity is live on Discord, only after 14 distinct local days of use, not before `snoozedUntil`, not while the review prompt is due (and a presence is installed), not within 14 days of the review prompt being answered. It also waits while a feature reveal is active. "Later" snoozes it 90 days, "Support" opens `nowly.me/support#donate` and snoozes it 180 days.
- Usage days live in `supportPrompt` (`chrome.storage.local`, never synced, never sent): `background/storage/support.store.ts` counts a day when the panel opens (`RECORD_USAGE_DAY`, sent with `SYNC_ACCOUNT`) or when an activity is sent to Discord (`broadcastActiveTab`), at most one write per local day. Snoozes go through `SNOOZE_SUPPORT_PROMPT`. No analytics event. The preview takes `?support=1` (14 days of use, `idle` scenario unless `scenario` is given).
- The "supported site" suggestion in `current-tab-section.tsx` has a bottom text link "Don't show again" (never next to "Install") that adds the slug to `settings.hiddenSuggestions`; the reset lives in Settings (sharing section).

## Notable dependencies
`components/shared/live-activity-card`, `hooks/use-presence-actions`, `shared/url-patterns` (catalog suggestion for the focused tab), background messages `SET_TAB_MUTED`, `GET_TAB_STATE`.
