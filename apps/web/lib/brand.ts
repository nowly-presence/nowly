export const CDN_BRAND = "https://cdn.nowly.me/brand";

export const brandLockup = (
  variant: "blue" | "dark" | "white",
  ext: "svg" | "png" = "svg",
): string => `${CDN_BRAND}/lockup/${variant}.${ext}`;

export const brandFavicon = (file: string): string => `${CDN_BRAND}/favicons/${file}`;

export const BRAND_LOCKUP_BLUE = brandLockup("blue");
export const BRAND_LOCKUP_BLUE_PNG = brandLockup("blue", "png");
export const BRAND_LOCKUP_WHITE = brandLockup("white");
export const BRAND_LOCKUP_WHITE_PNG = brandLockup("white", "png");

export const BRAND_FAVICON_SVG = brandFavicon("favicon.svg");
export const BRAND_FAVICON_16 = brandFavicon("favicon-16.png");
export const BRAND_FAVICON_32 = brandFavicon("favicon-32.png");
export const BRAND_FAVICON_192 = brandFavicon("favicon-192.png");
export const BRAND_FAVICON_512 = brandFavicon("favicon-512.png");

export const BRAND_METADATA_ICONS = {
  icon: [
    { url: BRAND_FAVICON_SVG, type: "image/svg+xml" },
    { url: BRAND_FAVICON_16, sizes: "16x16", type: "image/png" },
    { url: BRAND_FAVICON_32, sizes: "32x32", type: "image/png" },
    { url: BRAND_FAVICON_192, sizes: "192x192", type: "image/png" },
    { url: BRAND_FAVICON_512, sizes: "512x512", type: "image/png" },
  ],
  apple: BRAND_FAVICON_192,
};
