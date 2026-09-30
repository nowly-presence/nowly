# UI (design system)

Styling-only primitives built from https://nowly.me/design.md. One component per file, no business logic, no `chrome.*`, no i18n (labels come in as props).

## Add a primitive

1. Check the existing files first (button, chip, badge, card/group, row/switch-row, field-row, section, input, textarea, select, slider, segmented, switch, sheet, toast, skeleton, empty-state, horizontal-scroller, sortable-list, live-dot, dot-separator, locale-flag).
2. Create `ui/<name>.tsx`, style only with tokens from `tokens.css` (`bg-surface`, `text-muted`, `rounded-md`, `text-label-lg`...). No raw hex colours.
3. Variants go in a `Record<Variant, string>` map (see `button.tsx`), not in ad-hoc `className` overrides at call sites.

## Gotchas

- Clickable `Row`s render a `div role="button"` because rows host their own switches/buttons and a `<button>` cannot contain interactive content.
- `SwitchRow` is a `<label htmlFor>` bound to the switch (buttons are labelable), so the whole row toggles.
- `Select` reveals the active option by scrolling the list itself (`scrollIntoView` would scroll ancestors) and follows its trigger on page scroll instead of closing.
- `HScroll` draws its own scrollbar: native ones are hidden by macOS overlay scrollbars and headless browsers. The vertical wheel scrolls it horizontally until an end is reached.
- Buttons: `primary` (main CTA), `secondary` (outlined), `solid` (filled counterpart of secondary, e.g. "Manage" on installed catalog rows), `danger` (outlined destructive trigger), `destructive` (filled confirm), `inverse` (on dark cards), `link`.
- `LocaleFlag` copies `@nowly/ui`'s `locale-flag.tsx` (same SVGs as nowly.me), keyed by long locale; map to that component when migrating. `Select` options take an `icon` (flag or remix icon) shown in the trigger and the list.
`ui/locale-flag.tsx` remains local because the extension does not depend on `@nowly/ui`, which targets Next.js applications.

- Seasonal themes override tokens only: `.season-halloween` and `.dark.season-halloween` in `tokens.css` redefine the base variables (keep text contrast at least 4.5:1 on `--neutral` and `--surface`, and for `--neutral` on `--primary` since that is `on-primary`). `--season-accent` and `--season-shape` (`text-season-accent`, `bg-season-shape`) are transparent outside a season. `EmptyState` takes a `decoration` node drawn behind its content.
