import { BRAND_FAVICON_16, BRAND_FAVICON_32, BRAND_FAVICON_192, BRAND_FAVICON_SVG } from "@nowly/ui/brand";

export const BRAND_METADATA_ICONS = {
  icon: [
    {
      url: BRAND_FAVICON_SVG,
      type: "image/svg+xml"
    },
    {
      url: BRAND_FAVICON_32,
      sizes: "32x32",
      type: "image/png"
    },
    {
      url: BRAND_FAVICON_16,
      sizes: "16x16",
      type: "image/png"
    }
  ],
  apple: [
    {
      url: BRAND_FAVICON_192,
      sizes: "192x192",
      type: "image/png"
    }
  ]
};