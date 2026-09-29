import { CHROME_REVIEWS_URL, FIREFOX_REVIEWS_URL, WEB_BASE_URL } from "@/shared/constants"

export const siteUrl = (path: string): string => `${WEB_BASE_URL.replace(/\/$/, "")}${path}`

export const extensionDetailsUrl = (options: { useFirefoxAddonsPage?: boolean } = {}): string =>
  options.useFirefoxAddonsPage && import.meta.env.BROWSER === "firefox" ? "about:addons" : `chrome://extensions/?id=${chrome.runtime.id}`

export const storeReviews = (): { store: string; url: string } =>
  import.meta.env.BROWSER === "firefox" ? { store: "Firefox Add-ons", url: FIREFOX_REVIEWS_URL } : { store: "Chrome Web Store", url: CHROME_REVIEWS_URL }

export const openUrl = (url: string): void => {
  void chrome.tabs.create({ url })
}
