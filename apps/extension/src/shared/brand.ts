export const CDN_BRAND = "https://cdn.nowly.me/brand"

export const brandIcon = (variant: "blue" | "dark" | "white", size: 64 | 128 | 256 | 512 = 128): string =>
  `${CDN_BRAND}/icons/${variant}/${size}.svg`

export const brandLockup = (variant: "blue" | "dark" | "white" | "canary"): string => `${CDN_BRAND}/lockup/${variant}.svg`

export const IS_CANARY = import.meta.env.VITE_NOWLY_CHANNEL === "canary"
