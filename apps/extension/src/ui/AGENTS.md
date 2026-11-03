# UI (design system)

Styling-only primitives: one component per file, no business logic, no `chrome.*`, no i18n (labels come in as props). Imports only `ui` and third-party packages (plus the `LongLocale` type in `locale-flag.tsx`).

- Check the existing files before adding one. Style only with `tokens.css` tokens, never raw hex. Variants go in a `Record<Variant, string>` map (see `button.tsx`), never call-site `className` overrides.
- Button variants: `primary` main CTA, `secondary` outlined, `solid` filled secondary, `danger` outlined destructive trigger, `destructive` filled confirm, `inverse` on dark cards, `link`.
- Clickable `Row`s are `div role="button"` because they host interactive content; `SwitchRow` is a `<label htmlFor>` so the whole row toggles.
- `MultiStepSheet`: the caller owns values, validation, async actions and navigation; changing steps never submits; `busy` blocks dismissal.
- `Field` shows label, hint, then the control; `optional` adds "(optional)" after the label. It shares ids through context: `Input`, `Textarea`, `InputGroupInput` and `Select` take `aria-labelledby` (unless they have an `aria-label`), `aria-describedby` and `aria-invalid` from it.
- `InputGroup` joins addons to an input (counter, `Select bare` as a leading picker). `MenuButton` is an action menu that keeps focus in the field that opened it, so an insert at the caret keeps the selection.
- `SortableList` never starts a drag over buttons, links or inputs in a row; `onActivate` fires on a tap (under 4px) or Enter. `Sheet` keeps `onClose` in a ref so a parent re-render never steals focus from its inputs.
- `StepLayout` and `StepProgress` are shared by the onboarding and the presence creator; the layout pads its sticky footer itself. `CodeBlock` colours tokens from `lib/highlight.ts` (TypeScript and JSON only).
- `LocaleFlag` copies `@nowly/ui`'s flags (the extension does not depend on `@nowly/ui`). `streaming-text.tsx` is a prototype copy: never edit it.
- Seasons override tokens only (`.season-<id>`, `.dark.season-<id>`): keep text contrast at least 4.5:1 on `--neutral` and `--surface`, and for `--neutral` on `--primary`.
