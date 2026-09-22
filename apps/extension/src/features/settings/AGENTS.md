# Settings

The extension's settings screen, split into sections navigated via a list → detail pattern (`settings-screen.tsx`).

## Add a new settings section

1. Add the id to the `SettingsSectionId` union at the top of `settings-screen.tsx`.
2. Add an entry to the `SECTIONS: SectionEntry[]` array (same file) — `{ id, icon, titleKey, descriptionKey }`, where `titleKey`/`descriptionKey` are `t()` translation keys (add them to the extension's locale files, `settings-group-<id>`/`settings-group-<id>-description` is the existing naming convention).
3. Create `sections/<id>-section.tsx`, reusing `settings-block.tsx`/`settings-section-card.tsx`/`setting-row.tsx` for layout rather than custom markup.
4. Import it in `settings-screen.tsx` and render it when `section === "<id>"`, following the existing sections' pattern.

## Add a new setting row within an existing section

1. Add the `<SettingRow>` (or `<Switch>`/`<Slider>`/`<Input>` wrapped in one) inside the relevant `sections/*.tsx` file.
2. Persist the value via `sendMessage(...)` (from `@/lib/messages`) to the `background/`, not directly to `chrome.storage` — the `background/managers` are what actually apply a setting change to the running presence/native connection.

## Notable dependencies
`background/storage` (preference persistence), `background/managers` (applying changes to the runtime), `features/runtime-logs` (the "developer-logs" section renders `RuntimeLogsView` from that feature).
