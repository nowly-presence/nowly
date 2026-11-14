import { handleRemovedTab } from "@/background/managers/activity-manager";
import { getTabPresencesSnapshot } from "@/background/services/background-context";
import { getPresences } from "@/background/storage/presences.store";
import { urlMatchesPresence } from "@/shared/url-patterns";
import type { StoredPresence } from "@/shared/types";

const NO_TAB_ID = -1;

const presenceUrls = (stored: StoredPresence | undefined): string[] | undefined => (stored?.release?.metadata ?? stored?.metadata)?.url;

export const pruneStaleTabPresences = async (): Promise<void> => {
  const [entries, presences, tabs] = await Promise.all([
    getTabPresencesSnapshot(),
    getPresences(),
    chrome.tabs.query({})
  ]);

  const tabsById = new Map(tabs.map((tab) => [tab.id, tab]));

  const staleTabIds = entries
    .filter((entry) => {
      if (entry.tabId === NO_TAB_ID) return false;

      const tab = tabsById.get(entry.tabId);

      if (!tab) return true;

      const urls = presenceUrls(presences[entry.slug]);

      return Boolean(tab.url && urls && !urlMatchesPresence(tab.url, urls));
    })
    .map((entry) => entry.tabId);

  await Promise.all(staleTabIds.map((tabId) => handleRemovedTab(tabId)));
};