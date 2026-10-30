# Branding

Brand files are not in `public/`: they are CDN URLs built in `lib/brand.ts`. Upload new files to the CDN separately (`lockup/<variant>.<ext>`, `icons/<variant>/<size>.<ext>`).

- New logo or icon variant: widen the variant union and export `BRAND_LOCKUP_<VARIANT>` / `BRAND_ICON_<VARIANT>` (and `_PNG`) in `lib/brand.ts`, add it to `logoVariants` or `iconVariants` in `branding-view.tsx`, and add `variants.<key>` to `brandingPage` in all 11 locales.
- New color swatch: `{ key, hex }` in `colorSwatches` and `swatches.<key>` in `brandingPage` (all 11 locales). Canary swatches reuse `CANARY_ACCENT` / `CANARY_INK`.
