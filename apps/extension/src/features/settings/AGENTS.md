# Settings

Settings tab, one file per section under `sections/`.

## Add a setting

1. Add the field to `ExtensionSettings` (`shared/types/settings.ts`) and its default to `DEFAULT_SETTINGS` (`background/storage/settings.store.ts`).
2. If changing it must affect the runtime, handle it in `updateSettings` (`background/managers/settings-manager.ts`).
3. Add the row in the right `sections/*.tsx` with `SwitchRow`, `FieldRow` or `Row`; persist with `updateSettings` from `useExtensionState`, never `chrome.storage` directly.

## Add a section

Create `sections/<name>-section.tsx` and render it in `settings-view.tsx`.

## Gotchas

- Language selects show a `LocaleFlag` per locale with native names (`LOCALE_NAMES` / `longLocaleName`), never translated names.
- `FieldRow` `note` is the full-width italic line under a row, for constraints the user must know (e.g. the shared-languages rule on "Discord language").

- Theme: System, Light, Dark (`AppearanceMode`), then the "Show seasonal themes" switch (`seasonalThemes`, on by default) that lays the active season on top. See "Seasonal themes" in the root `AGENTS.md` for the migration.

- `suggestPresences` (default on) only hides the "supported site" row of the Activity tab's current-tab section; no background behaviour depends on it. `hiddenSuggestions` holds the slugs hidden one by one with the "Don't show again" link under that row (undo in the toast); the sharing section shows a "Hidden suggestions" row with a reset while it is non-empty.

## Notable dependencies
`EXPORT_DEVICE_DATA` / `DELETE_DEVICE_DATA` (`/devices/:deviceId`, need the device token minted by `/devices/sync`), `INSTALL_LOCAL_PRESENCE_ZIP` (canary only), `ui/sortable-list` (priority order).
