# Settings

One file per section in `sections/`, rendered in `settings-view.tsx`.

- New setting: field in `ExtensionSettings` (`shared/types/settings.ts`), default in `DEFAULT_SETTINGS` (`background/storage/settings.store.ts`), runtime effect in `updateSettings` (`background/managers/settings-manager.ts`) when needed, and a `SwitchRow`, `FieldRow` or `Row`. Persist with `updateSettings` from `useExtensionState`, never `chrome.storage` directly. Only keys in `SYNCED_SETTINGS_KEYS` sync: device-specific settings never belong there.
- Language selects show `LocaleFlag` and native names (`LOCALE_NAMES`), never translated names.
- `FieldRow` `note` is reserved for constraints the user must know.
- The analytics consent switch (privacy section) is independent of legal receipts and of the account.
