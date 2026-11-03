import { getFocusedTabId, setFocusedTabId } from "@/background/services/background-context";

export const resolveFocusedTab = async (): Promise<chrome.tabs.Tab | undefined> => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  if (tab?.id != null) {
    setFocusedTabId(tab.id);
    return tab;
  }

  const tabId = getFocusedTabId();
  return tabId == null ? undefined : chrome.tabs.get(tabId).catch(() => undefined);
};