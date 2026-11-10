import { DEFAULT_EXTENSION_ID } from "./extension-id";

const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID || DEFAULT_EXTENSION_ID;

export const PROJECT_EXTENSION_DOWNLOAD_URL = `https://chromewebstore.google.com/detail/nowly/${extensionId}`;
export const FIREFOX_EXTENSION_DOWNLOAD_URL = "https://addons.mozilla.org/en-US/firefox/addon/nowly-presence/";

export type ExtensionBrowser = "chrome" | "firefox";

export const detectExtensionBrowser = (): ExtensionBrowser => {
  if (typeof navigator === "undefined") {
    return "chrome";
  }

  return /(?:Firefox|FxiOS)\//i.test(navigator.userAgent) ? "firefox" : "chrome";
};

export const getExtensionDownloadUrl = (browser: ExtensionBrowser) => (browser === "firefox" ? FIREFOX_EXTENSION_DOWNLOAD_URL : PROJECT_EXTENSION_DOWNLOAD_URL);