export const CDN_BRAND = "https://cdn.nowly.me/brand";

export const brandLockup = (
  variant: "blue" | "dark" | "white",
  ext: "svg" | "png" = "svg",
): string => `${CDN_BRAND}/lockup/${variant}.${ext}`;

export const BRAND_LOCKUP_BLUE = brandLockup("blue");
