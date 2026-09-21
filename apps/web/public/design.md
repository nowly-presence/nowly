---
version: alpha
name: Nowly
description: A light, airy real-time presence system with a crisp cyan accent and soft editorial typography.
colors:
  primary: "#0891b2"
  secondary: "#4a5560"
  tertiary: "#07080c"
  neutral: "#eef5fc"
  surface: "#ffffff"
  on-surface: "#07080c"
  muted-border: "#e5e7eb"
  subtle-border: "#07080c1f"
  overlay: "#000000cc"
  success: "#22c55e"
  error: "#ef4444"
colors-dark:
  primary: "#22d3ee"
  secondary: "#808e9b"
  tertiary: "#0c0e14"
  neutral: "#07080c"
  surface: "#0c0e14"
  on-surface: "#e4f2ff"
  muted-border: "rgba(228, 242, 255, 0.08)"
  subtle-border: "rgba(228, 242, 255, 0.12)"
  overlay: "#000000cc"
  success: "#22c55e"
  error: "oklch(0.704 0.191 22.216)"
typography:
  headline-display:
    fontFamily: Satoshi
    fontSize: 54px
    fontWeight: 500
    lineHeight: 56.816px
    letterSpacing: -1.34px
  headline-lg:
    fontFamily: Satoshi
    fontSize: 41px
    fontWeight: 400
    lineHeight: 49px
    letterSpacing: 0px
  headline-md:
    fontFamily: Satoshi
    fontSize: 31px
    fontWeight: 400
    lineHeight: 37px
    letterSpacing: 0px
  headline-sm:
    fontFamily: Satoshi
    fontSize: 24px
    fontWeight: 400
    lineHeight: 29px
    letterSpacing: 0px
  body-lg:
    fontFamily: Satoshi
    fontSize: 18px
    fontWeight: 400
    lineHeight: 27.9px
    letterSpacing: 0px
  body-md:
    fontFamily: Satoshi
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  body-sm:
    fontFamily: Satoshi
    fontSize: 14px
    fontWeight: 400
    lineHeight: 21px
    letterSpacing: 0px
  label-lg:
    fontFamily: Satoshi
    fontSize: 14px
    fontWeight: 500
    lineHeight: 21px
    letterSpacing: 0px
  label-md:
    fontFamily: Satoshi
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0px
  label-sm:
    fontFamily: Satoshi
    fontSize: 11px
    fontWeight: 500
    lineHeight: 14px
    letterSpacing: 0px
rounded:
  none: 0px
  sm: 8px
  md: 10px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 8px
  sm: 16px
  md: 32px
  lg: 40px
  xl: 84px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: "11px 10px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: "11px 10px"
    height: "36px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: "11px 10px"
    height: "36px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "0px"
  card:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.tertiary}"
    rounded: "{rounded.md}"
    padding: "11px 12px"
    height: "36px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "6px 10px"
  cookie-banner:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.none}"
    padding: "{spacing.sm}"
---

# Nowly

## Overview
Nowly feels calm, modern, and product-led, with a light editorial canvas supporting a dark, app-like content stack. The visual tone is professional but approachable: restrained navigation, generous whitespace, and a vivid cyan accent suggest clarity and speed rather than ornament. The layout is spacious and airy, designed for a developer or productivity audience that values simple hierarchy and immediate comprehension.

## Colors
- **Primary (#0891b2):** A bright cyan-teal used for the main CTA, key highlights, and the "real time" wordmark treatment. It provides the only strong chromatic emphasis in an otherwise quiet system.
- **Neutral (#eef5fc):** A pale sky-tinted background that gives the page its soft, open feel. It acts as the base surface for the landing page and the cookie area.
- **Surface (#ffffff):** Reserved for clean panels and any white content containers. It should stay minimal so the interface feels crisp rather than boxed in.
- **On-surface (#07080c):** An almost-black ink used for headings, body text, and dark card interiors. It anchors the page and creates strong contrast on the light background.
- **Secondary (#4a5560):** A muted slate for supporting links and secondary explanatory text. Use it for less prominent actions like browse links and footer-style copy.
- **Muted border (#e5e7eb):** A very light neutral border for cards and subtle separators. It reinforces structure without adding visual weight.
- **Subtle border (#07080c1f):** A transparent ink border used on outlined controls. This is ideal for secondary buttons that need definition without competing with the primary CTA.
- **Overlay (#000000cc):** A deep overlay tone for any darkened layer or floating media treatment. It keeps emphasis on the foreground content.
- **Success (#22c55e):** A positive green used sparingly for activity indicators and "online" style micro-status.
- **Error (#ef4444):** Reserved for destructive or failure states; it is not a prominent part of the current composition.

### Dark theme
Nowly ships a dark theme alongside the light one above (`.dark` in the product's actual stylesheet). The relationship inverts rather than reinvents: the near-black ink used for text on the light background becomes the near-black surface color in dark mode, and vice versa. Structure, spacing, radii, and typography stay identical between themes — only the color values swap.

- **Primary (#22d3ee):** A brighter, higher-contrast cyan than the light theme's #0891b2, needed to read clearly against dark surfaces. Same role: main CTA, key highlights, focus rings.
- **Neutral (#07080c):** The page background — the darkest surface in the theme, inverted from the light theme's pale #eef5fc.
- **Surface (#0c0e14):** Card and popover backgrounds, one step lighter than the page background for elevation (the opposite direction from the light theme, where surface is lighter than neutral).
- **On-surface (#e4f2ff):** Light ink used for headings and body text on dark surfaces, the inverse of the light theme's near-black #07080c.
- **Secondary (#808e9b):** Muted slate-gray for supporting links and secondary copy, same role as the light theme's #4a5560 but lightened for dark-surface contrast.
- **Tertiary (#0c0e14):** In the light theme this is the near-black card treatment reserved for floating/dark-mode-style cards; in dark mode the whole page already lives in that register, so tertiary converges with surface.
- **Muted border (rgba(228, 242, 255, 0.08)):** Same low-visual-weight role as the light theme's #e5e7eb, expressed as a translucent light-ink border instead of a solid pale gray.
- **Subtle border (rgba(228, 242, 255, 0.12)):** Outline-control border, same role as the light theme's #07080c1f, inverted to a translucent light tone.
- **Overlay (#000000cc):** Unchanged between themes — a deep dark overlay reads correctly on both.
- **Success (#22c55e):** Unchanged between themes.
- **Error (oklch(0.704 0.191 22.216)):** A lighter, higher-lightness red than the light theme's #ef4444, so it stays legible on dark surfaces without turning muddy.

## Typography
Satoshi is the sole voice of the system and should be used consistently across headings, body copy, labels, and controls. Headlines are light-to-medium in weight, with a refined, modern rhythm; the hero uses a 54px display style with tight negative tracking for impact, while subheads step down cleanly through 41px, 31px, and 24px sizes. Body text stays comfortable and readable at 18px with generous leading, and interface labels/buttons use 14px or smaller weights of 500 for clarity.

There is no heavy uppercase convention in the screenshot. Instead, emphasis comes from size, weight, and occasional color contrast rather than letter casing or wide tracking.

## Layout & Spacing
The layout is a wide, fixed-max-width hero composition with substantial breathing room around the content. Primary attention sits left-of-center for the headline and supporting copy, while the right side carries an overlapping stack of floating cards that create motion and depth without requiring a dense grid. Spacing follows a loose but consistent rhythm: 8px for small internal gaps, 16px for grouped elements, 32px for sectional separation, and larger 40px/84px steps for hero and page-level spacing.

Padding is restrained inside controls and cards, keeping the system compact and efficient. Sections feel open rather than heavily boxed, and the bottom cookie area acts like a full-width utility bar rather than a major content block.

## Elevation & Depth
The system is intentionally flat overall, with very little reliance on shadow. Hierarchy is created mostly through contrast, layering, and overlap: dark cards sit on the pale background, while faint borders and translucency define structure. The only notable "elevation" effect is the stacking of the app-preview cards, which appear to float through scale, blur, opacity, and offset rather than dramatic drop shadows.

## Shapes
The shape language is soft and modern, with medium radii on interactive elements and cards. Buttons use a 10px radius, cards are gently rounded at 8px, and larger floating media panels keep rounded corners to feel approachable without becoming playful. Full pills are used selectively for chips and badge-like treatments.

## Components
Buttons are compact and utility-focused. `button-primary` is the dominant call to action: cyan background, light text, medium weight, 36px height, and modest horizontal padding. It should feel solid and immediate, with no visible shadow. `button-secondary` is an outlined or transparent counterpart that keeps the same sizing logic but relies on the subtle border for definition. `button-link` is minimal, underlined, and best for secondary navigation like "Browse the library."

Cards should use the dark visual language seen in the activity previews: `card` can be treated as either a pale framed container or, for the floating preview pattern, a near-black surface with rounded corners and compact internal padding. Content inside cards should remain tightly grouped and clearly separated by label, title, progress, and action rows.

Inputs are not heavily featured, but when used they should be calm and low-contrast: white or very light surfaces, 10px corners, and restrained padding. Focus states should preserve the system's minimalism by relying on border/color change rather than heavy glow.

Chips and status pills should be small, rounded, and lightly padded. They work best as contextual metadata for activity or platform labels. Tooltips, menus, and dropdowns should remain simple and low-elevation, following the same muted-border logic as other supporting UI.

The cookie banner should behave as a full-width utility strip with low visual priority: neutral background, small body text, a clear underlined link, and a compact dark confirmation button.

## Do's and Don'ts
- Do keep the interface spacious, airy, and highly readable.
- Do use Satoshi consistently across all typography levels and controls.
- Do reserve the cyan primary color for the main CTA and key highlights.
- Do rely on contrast and layering more than heavy shadows.
- Do keep radii modest and consistent, especially around buttons and cards.
- Don't introduce saturated secondary colors that compete with the primary cyan.
- Don't make cards or banners overly shadowed, glossy, or skeuomorphic.
- Don't use dense, cramped layouts or large amounts of bordered chrome.
