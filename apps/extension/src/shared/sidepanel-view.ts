import type { AppView } from "@/components/layout/bottom-nav";

export const SIDEPANEL_VIEW_KEY = "sidepanelActiveView";

export type PersistedAppView = Exclude<AppView, "logs">;

export const isPersistedAppView = (value: unknown): value is PersistedAppView =>
  value === "home" || value === "settings";

export const loadPersistedAppView = async (): Promise<PersistedAppView> => {
  const result = await chrome.storage.local.get(SIDEPANEL_VIEW_KEY);
  return isPersistedAppView(result[SIDEPANEL_VIEW_KEY]) ? result[SIDEPANEL_VIEW_KEY] : "home";
};

export const persistAppView = (view: AppView): void => {
  if (!isPersistedAppView(view)) return;
  void chrome.storage.local.set({ [SIDEPANEL_VIEW_KEY]: view });
};
