# Branding

Rendered by `app/[locale]/branding`: `branding-view.tsx` shows the downloadable logo/icon/color kit.

## Add a new logo/icon variant

1. Add the SVG and PNG asset files under `public/` (see the `BRAND_LOCKUP_*`/`BRAND_ICON_*` constants in `lib/brand.ts` for the existing naming: `<lockup|icon>-<variant>.svg`/`.png`).
2. Export the new asset paths as constants from `lib/brand.ts` (root, shared).
3. Add an entry to `logoVariants` or `iconVariants` in `branding-view.tsx`: `{ key: "your-variant", svg: YOUR_SVG, png: YOUR_PNG, bg: "bg-[#hex]" }`.
4. Add the translation key `variants.your-variant` to the `brandingPage` namespace in all 11 locale files under `apps/web/messages/*.json`.

## Add a new color swatch

1. Add `{ key: "your-color", hex: "#RRGGBB" }` to `colorSwatches` in `branding-view.tsx`.
2. Add the translation key `swatches.your-color` to the `brandingPage` namespace, same locale files as above.

## Notable dependencies
`lib/brand.ts`, `lib/constants.ts` (root, shared).
