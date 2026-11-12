const ANDROID_PATTERN = /android/i;

const previewForcesMobile = (): boolean => import.meta.env.VITE_PREVIEW === "1" && new URLSearchParams(location.search).get("platform") === "android";

export const isFirefoxMobile = (): boolean => previewForcesMobile() || (import.meta.env.BROWSER === "firefox" && ANDROID_PATTERN.test(navigator.userAgent));