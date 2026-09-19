type ChromeWithSidebarAction = typeof chrome & {
  sidebarAction?: { open(): Promise<void> };
};

const openForWindow = (sidePanel: typeof chrome.sidePanel, windowId: number): void => {
  void sidePanel.open({ windowId }).catch(() => {});
};

/**
 * chrome.sidePanel.open() must run in the same user-gesture turn.
 * Do not await other APIs (storage, windows.getLastFocused as a Promise) first.
 */
export const openNowlyPanel = (tab?: chrome.tabs.Tab): void => {
  if (import.meta.env.BROWSER === "firefox") {
    void (chrome as ChromeWithSidebarAction).sidebarAction?.open()?.catch(() => {});
    return;
  }

  const sidePanel = chrome.sidePanel;
  if (!sidePanel) return;

  if (typeof tab?.windowId === "number") {
    openForWindow(sidePanel, tab.windowId);
    return;
  }

  if (typeof tab?.id === "number") {
    void sidePanel.open({ tabId: tab.id }).catch(() => {});
    return;
  }

  chrome.windows.getLastFocused({ windowTypes: ["normal"] }, (win) => {
    if (chrome.runtime.lastError) return;
    if (typeof win?.id === "number") openForWindow(sidePanel, win.id);
  });
};
