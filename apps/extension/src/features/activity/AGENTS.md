# Activity

- New section: `<name>-section.tsx` reading `useExtensionState`, returning `null` when empty, rendered in `activity-view.tsx`. Shared derived data comes from `use-activity-overview.ts`.
- New presence status: add it to `PresenceStatus` and `presenceStatus` (`lib/presence-status.ts`, aligned with `shouldHoldDiscord` in `background/managers/activity-manager.ts`), then its label and tone in `presence-status-text.ts` and its `status.*` key in every locale.
- Support card: `shouldShowSupportCard` (`shared/support-prompt.ts`, tested) is the single rule. Never an overlay; usage days stay local (never synced or sent) and there is no analytics event. Preview: `?support=1`.
- "Don't show again" on the supported-site suggestion is a text link at the bottom, never next to Install.
