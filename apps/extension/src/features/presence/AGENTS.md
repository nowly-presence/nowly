# Presence

Presence page for both installed and catalog-only presences: hero, primary actions, stats, about, settings, snooze, schedule, info, report, uninstall.

## Support a new presence setting type

1. The type must exist in `packages/sdk` settings types and `packages/presences/metadata.schema.json` first.
2. Add it to `Definition` and `normalizeDefinitions` in `presence-settings-fields.tsx`, then render it in `PresenceSettingsList` with a `ui/` control inside a `FieldRow` (or a `SwitchRow` for booleans).
3. Values are saved with `SET_PRESENCE_SETTINGS`; the background pushes them to the running script.

## Add a section

Create `presence-<name>-section.tsx` taking `view` (and `stored` when installed-only) and render it in `presence-detail-view.tsx`.

## Gotchas

- `usePresenceDetails` merges installed metadata with live catalog stats; a catalog-only presence has no `stored`. Publication dates come from the catalog item, or from the installed release (`GET /presences/:slug`) when the catalog isn't loaded.
- Per-presence schedules are ignored while the global `scheduleEnabled` switch is off (`shouldHoldDiscord`), so enabling one also enables the global switch.
- `AuthorLink` has two looks: `inline` (hero, underlined, 14px icon) and `row` (info section, 16px icon, no underline). Pick the variant, never restyle it from the caller.
- Settings definitions come from the presence's `Presence.Settings({...})`, published as `settings.json` on the CDN and embedded in `metadata.settings`.

## Notable dependencies
`GET_PRESENCE_ENGAGEMENT`, `SET_PRESENCE_LIKE`, `REPORT_PRESENCE` (`POST /presences/:slug/report`, 750 chars max), `SNOOZE_PRESENCE`, `SET_PRESENCE_SCHEDULE`, `components/shared/schedule-editor`.
