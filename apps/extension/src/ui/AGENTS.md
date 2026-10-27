# UI (design system)

Styling-only primitives built from https://nowly.me/design.md. One component per file, no business logic, no `chrome.*`, no i18n (labels come in as props). Imports: `ui`, third-party packages, and the `LongLocale` type from `@/shared/locales` (`locale-flag.tsx` only).

## Add a primitive

1. Check the existing files first: button, chip, badge, card, checkbox, modal, row (with `SwitchRow`), field-row, section, input, textarea, select, slider, segmented, switch, sheet, toast, skeleton, empty-state, horizontal-scroller, sortable-list, live-dot, dot-separator, info-tooltip, locale-flag, streaming-text. Shared helpers: `cn.ts` (class merging), `field-styles.ts` (`fieldBase` for inputs).
2. Create `ui/<name>.tsx`, style only with tokens from `tokens.css` (`bg-surface`, `text-muted`, `rounded-md`, `text-label-lg`...). No raw hex colours.
3. Variants go in a `Record<Variant, string>` map (see `button.tsx`), not in ad-hoc `className` overrides at call sites.

## Gotchas

- Clickable `Row`s render a `div role="button"` because rows host their own switches/buttons and a `<button>` cannot contain interactive content.
- `SwitchRow` is a `<label htmlFor>` bound to the switch (buttons are labelable), so the whole row toggles.
- `Select` reveals the active option by scrolling the list itself (`scrollIntoView` would scroll ancestors) and follows its trigger on page scroll instead of closing. Options take an `icon` (flag or remix icon) shown in the trigger and the list.
- `HScroll` draws its own scrollbar: native ones are hidden by macOS overlay scrollbars and headless browsers. The vertical wheel scrolls it horizontally until an end is reached.
- Buttons: `primary` (main CTA), `secondary` (outlined), `solid` (filled counterpart of secondary, e.g. "Manage" on installed catalog rows), `danger` (outlined destructive trigger), `destructive` (filled confirm), `inverse` (on dark cards), `link`.
- `MultiStepSheet` wraps `Sheet` with controlled `steps` and a stable `currentStep` id. Each step supplies its title, optional description, free-form `content` and `footer`. Content may include a form and footer buttons can target it through the native `form` attribute. The caller owns values, validation, asynchronous actions and navigation; changing steps never submits or advances automatically. Multiple steps show `current/total`, single-step flows omit it. `busy` blocks dismissal during an action; callers also disable their footer controls. Closing and remounting a flow resets its local state.
- `LocaleFlag` is keyed by long locale and copies the SVGs of `@nowly/ui`'s `locale-flag.tsx` (same as nowly.me). It stays local because the extension does not depend on `@nowly/ui`, which targets Next.js.
- `streaming-text.tsx` is a byte-for-byte prototype copy: do not edit it.
- Seasonal themes override tokens only: `.season-<id>` and `.dark.season-<id>` in `tokens.css` redefine the base variables (keep text contrast at least 4.5:1 on `--neutral` and `--surface`, and for `--neutral` on `--primary` since that is `on-primary`). `--season-accent` and `--season-shape` (`text-season-accent`, `bg-season-shape`) are transparent outside a season. `EmptyState` takes a `decoration` node drawn behind its content.
