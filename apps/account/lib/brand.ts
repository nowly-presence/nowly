const CDN_BRAND = "https://cdn.nowly.me/brand";

export const BRAND_LOCKUP_DARK = `${CDN_BRAND}/lockup/dark.svg`;
export const BRAND_LOCKUP_WHITE = `${CDN_BRAND}/lockup/white.svg`;

export const BRAND_METADATA_ICONS = {
  icon: [
    {
      url: `${CDN_BRAND}/favicons/favicon.svg`,
      type: "image/svg+xml"
    },
    {
      url: `${CDN_BRAND}/favicons/favicon-32.png`,
      sizes: "32x32",
      type: "image/png"
    },
    {
      url: `${CDN_BRAND}/favicons/favicon-16.png`,
      sizes: "16x16",
      type: "image/png"
    }
  ],
  apple: [
    {
      url: `${CDN_BRAND}/favicons/favicon-192.png`,
      sizes: "192x192",
      type: "image/png"
    }
  ]
};