export const CDN_BRAND = "https://cdn.nowly.me/brand";

export const brandLockup = (
  variant: "blue" | "dark" | "white" | "canary",
  ext: "svg" | "png" = "svg",
): string => `${CDN_BRAND}/lockup/${variant}.${ext}`;

export const BRAND_LOCKUP_BLUE = brandLockup("blue");
export const BRAND_LOCKUP_CANARY = brandLockup("canary");
export const BRAND_LOCKUP = import.meta.env.VITE_NOWLY_CHANNEL === "canary"
  ? BRAND_LOCKUP_CANARY
  : BRAND_LOCKUP_BLUE;
