# Activity

The extension's main screen: presence list, presence detail, quick actions (schedule/snooze/context menu).

## Add support for a new presence setting type

Presence authors declare settings in their `metadata.json` (`packages/presences`, validated against `packages/sdk`'s `Metadata` type: `BooleanSetting`, `InputSetting`, `SelectSetting`, `SliderSetting`). To render a new setting type here:

1. Open `presence-settings-fields.tsx` and find the `type === "..."` branches (around line 131 for `boolean`, 149 for `input`, 169 for `select` — sliders are inferred separately via `inferType`).
2. Add a new `if (type === "your-type") { ... }` branch rendering the right `@/ui` primitive, following the existing branches' pattern (read from `values[key]`, call `handleChange(key, newValue)` on change).
3. The new setting type must already exist as a case in `packages/sdk`'s `Metadata`/settings types and in `packages/presences/metadata.schema.json` — this component only renders what a presence's metadata declares, it doesn't define new schema shapes.

## Add a new quick action (like schedule/snooze)

1. Add the trigger to `presence-context-menu.tsx` (the menu every presence list item/card exposes).
2. If it needs a modal, create `your-action-dialog.tsx` following `schedule-dialog.tsx`'s pattern: a controlled dialog taking the presence slug/id as props, sending a message to the `background/` via `sendMessage(...)` (from `@/lib/messages`) on confirm.
3. Don't call `chrome.storage`/native-host APIs directly from a UI component — always go through `sendMessage` to the `background/` router, same as every existing action here.

## Notable dependencies
`background/` (runtime presence state, via the message router — `@/lib/messages`'s `sendMessage`), `@nowly/sdk` (setting types), `features/layout` (header/bottom-nav), `components/shared` (presence-tile, locale-flag).
