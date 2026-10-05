import { CHROME_REVIEWS_URL, DOCS_BASE_URL, FIREFOX_REVIEWS_URL, WEB_BASE_URL } from "@/shared/constants"
import type { Locale } from "@/shared/locales"

const DEFAULT_DOCS_LOCALE: Locale = "en"

export const siteUrl = (path: string): string => `${WEB_BASE_URL.replace(/\/$/, "")}${path}`

export const docsUrl = (path: string, locale: Locale): string =>
  `${DOCS_BASE_URL}${locale === DEFAULT_DOCS_LOCALE ? "" : `/${locale}`}${path}`

export const extensionDetailsUrl = (options: { useFirefoxAddonsPage?: boolean } = {}): string =>
  options.useFirefoxAddonsPage && import.meta.env.BROWSER === "firefox" ? "about:addons" : `chrome://extensions/?id=${chrome.runtime.id}`

export const storeReviews = (): { store: string; url: string } =>
  import.meta.env.BROWSER === "firefox" ? { store: "Firefox Add-ons", url: FIREFOX_REVIEWS_URL } : { store: "Chrome Web Store", url: CHROME_REVIEWS_URL }

export const openUrl = (url: string): void => {
  void chrome.tabs.create({ url })
}
