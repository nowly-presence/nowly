import { WEB_BASE_URL } from "@/shared/constants";

export const siteUrl = (path: string): string => `${WEB_BASE_URL.replace(/\/$/, "")}${path}`;

export const extensionDetailsUrl = (options: { useFirefoxAddonsPage?: boolean } = {}): string =>
  options.useFirefoxAddonsPage && import.meta.env.BROWSER === "firefox"
    ? "about:addons"
    : `chrome://extensions/?id=${chrome.runtime.id}`;

export const openUrl = (url: string): void => {
  void chrome.tabs.create({ url });
};