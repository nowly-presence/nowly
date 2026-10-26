# Branding

`app/[locale]/branding` renders `components/branding-view.tsx`: the downloadable logo, icon and color kit.

Brand assets are not in `public/`: they are CDN URLs (`https://cdn.nowly.me/brand/...`) built in `lib/brand.ts` by `brandLockup(variant, ext)`, `brandIcon(variant, size, ext)` and `brandFavicon(file)`, and exported as `BRAND_LOCKUP_*` / `BRAND_ICON_*` constants. The files must be uploaded to the CDN separately.

## Add a logo/icon variant

1. Upload the SVG and PNG to the CDN following the existing layout (`lockup/<variant>.<ext>`, `icons/<variant>/<size>.<ext>`).
2. Widen the variant union in `brandLockup`/`brandIcon` and export `BRAND_LOCKUP_<VARIANT>` / `BRAND_ICON_<VARIANT>` (+ `_PNG`) from `lib/brand.ts`.
3. Add `{ key, svg, png, bg: "bg-[#hex]" }` to `logoVariants` or `iconVariants` in `branding-view.tsx` (widen the `key` type there too).
4. Add `variants.<key>` to the `brandingPage` namespace in all 11 `messages/*.json`.

## Add a color swatch

1. Add `{ key, hex }` to `colorSwatches` in `branding-view.tsx` (canary swatches reuse `CANARY_ACCENT`/`CANARY_INK`).
2. Add `swatches.<key>` to `brandingPage` in all 11 locale files.

## Notable dependencies
`lib/brand.ts` (root, shared).
