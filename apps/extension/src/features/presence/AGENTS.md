# Presence page

- New setting type: it must first exist in the SDK settings types and the presences repository's `metadata.schema.json`. Then add it to `Definition` and `normalizeDefinitions` (`presence-settings-fields.tsx`) and render it in `PresenceSettingsList` with a `ui/` control (`FieldRow`, or `SwitchRow` for booleans). Values save through `SET_PRESENCE_SETTINGS`.
- New section: `presence-<name>-section.tsx` taking `view` (and `stored` when installed-only), rendered in `presence-detail-view.tsx`.
- A catalog-only presence has no `stored`. Publication dates come from the catalog item, or from the installed release when the catalog is not loaded.
- Enabling a per-presence schedule also enables the global `scheduleEnabled` switch, without which schedules are ignored.
- `AuthorLink` has `inline` and `row` variants: pick one, never restyle it from the caller.
