import type { AppView } from "@/components/layout/bottom-nav";

export const SIDEPANEL_VIEW_KEY = "sidepanelActiveView";
export const SIDEPANEL_NAV_KEY = "sidepanelPendingNav";

export type PersistedAppView = Exclude<AppView, "logs">;

export type SidepanelPendingNav = {
  at: number;
  query?: string;
  slug?: string;
  view: PersistedAppView;
};

export const isPersistedAppView = (value: unknown): value is PersistedAppView =>
  value === "home" || value === "store" || value === "settings";

export const isSidepanelPendingNav = (value: unknown): value is SidepanelPendingNav => {
  if (!value || typeof value !== "object") return false;
  const nav = value as SidepanelPendingNav;
  return isPersistedAppView(nav.view) && typeof nav.at === "number";
};

export const loadPersistedAppView = async (): Promise<PersistedAppView> => {
  const result = await chrome.storage.local.get(SIDEPANEL_VIEW_KEY);
  return isPersistedAppView(result[SIDEPANEL_VIEW_KEY]) ? result[SIDEPANEL_VIEW_KEY] : "home";
};

export const persistAppView = (view: AppView): void => {
  if (!isPersistedAppView(view)) return;
  void chrome.storage.local.set({ [SIDEPANEL_VIEW_KEY]: view });
};

export const setPendingSidepanelNav = (nav: Omit<SidepanelPendingNav, "at">): Promise<void> =>
  chrome.storage.local.set({
    [SIDEPANEL_NAV_KEY]: { ...nav, at: Date.now() } satisfies SidepanelPendingNav,
    [SIDEPANEL_VIEW_KEY]: nav.view,
  });

export const loadPendingSidepanelNav = async (): Promise<SidepanelPendingNav | null> => {
  const result = await chrome.storage.local.get(SIDEPANEL_NAV_KEY);
  return isSidepanelPendingNav(result[SIDEPANEL_NAV_KEY]) ? result[SIDEPANEL_NAV_KEY] : null;
};

export const clearPendingSidepanelNav = (): Promise<void> =>
  chrome.storage.local.remove(SIDEPANEL_NAV_KEY);
