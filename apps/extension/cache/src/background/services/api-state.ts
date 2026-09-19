import { API_BASE_URL, WEB_BASE_URL } from "@/shared/constants";
import { getCustomApiUrl, setCustomApiUrl } from "@/background/services/background-context";
import { getSettings } from "@/background/services/storage";

export const getEffectiveApiUrl = (): string => getCustomApiUrl()?.replace(/\/$/, "") || API_BASE_URL;

export const getEffectiveWebUrl = (): string => WEB_BASE_URL;

export const initializeCustomApiUrl = async (): Promise<void> => {
  const settings = await getSettings();
  setCustomApiUrl(settings.customApiBaseUrl);
};

export const updateContentScriptsOrigin = async (): Promise<void> => {
  const origin = new URL(getEffectiveWebUrl()).origin;
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id!, { type: "UPDATE_MARKETPLACE_ORIGIN", origin }).catch(() => {});
  }
};