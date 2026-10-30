# UI (design system)

Styling-only primitives: one component per file, no business logic, no `chrome.*`, no i18n (labels come in as props). Imports only `ui` and third-party packages (plus the `LongLocale` type in `locale-flag.tsx`).

- Check the existing files before adding one. Style only with `tokens.css` tokens, never raw hex. Variants go in a `Record<Variant, string>` map (see `button.tsx`), never call-site `className` overrides.
- Button variants: `primary` main CTA, `secondary` outlined, `solid` filled secondary, `danger` outlined destructive trigger, `destructive` filled confirm, `inverse` on dark cards, `link`.
- Clickable `Row`s are `div role="button"` because they host interactive content; `SwitchRow` is a `<label htmlFor>` so the whole row toggles.
- `MultiStepSheet`: the caller owns values, validation, async actions and navigation; changing steps never submits; `busy` blocks dismissal.
- `LocaleFlag` copies `@nowly/ui`'s flags (the extension does not depend on `@nowly/ui`). `streaming-text.tsx` is a prototype copy: never edit it.
- Seasons override tokens only (`.season-<id>`, `.dark.season-<id>`): keep text contrast at least 4.5:1 on `--neutral` and `--surface`, and for `--neutral` on `--primary`.
