import { FIREFOX_EXTENSION_DOWNLOAD_URL, PROJECT_EXTENSION_DOWNLOAD_URL } from "@/lib/constants";

export type ExtensionBrowser = "chrome" | "firefox";

export const detectExtensionBrowser = (): ExtensionBrowser => {
  if (typeof navigator === "undefined") {
    return "chrome";
  }

  return /(?:Firefox|FxiOS)\//i.test(navigator.userAgent) ? "firefox" : "chrome";
};

export const getExtensionDownloadUrl = (browser: ExtensionBrowser) =>
  browser === "firefox" ? FIREFOX_EXTENSION_DOWNLOAD_URL : PROJECT_EXTENSION_DOWNLOAD_URL;
