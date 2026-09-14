import { fetchPresenceCatalog } from "@/background/managers/presence-manager";
import { urlMatchesPresence } from "@/background/runtime/url-match";
import { getPresences } from "@/background/services/storage";
import { openNowlyPanel } from "@/background/services/open-panel";
import { persistAppView, setPendingSidepanelNav } from "@/shared/sidepanel-view";

const MENU_ID = "nowly-page-presence";

let clickListenerBound = false;

const hostnameQuery = (href: string): string => {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const resolveContextMenuNav = async (
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab,
): Promise<void> => {
  const href = tab?.url ?? info.pageUrl;
  if (!href) {
    await setPendingSidepanelNav({ view: "store" });
    persistAppView("store");
    return;
  }

  const presences = await getPresences();
  const installed = Object.entries(presences).find(([, presence]) =>
    urlMatchesPresence(href, presence.metadata.url),
  );

  if (installed) {
    await setPendingSidepanelNav({ view: "home", slug: installed[0] });
    persistAppView("home");
    return;
  }

  try {
    const catalog = await fetchPresenceCatalog();
    const catalogMatch = catalog.find((item) => urlMatchesPresence(href, item.url));
    if (catalogMatch) {
      await setPendingSidepanelNav({ view: "store", slug: catalogMatch.slug });
      persistAppView("store");
      return;
    }
  } catch {
    // Offline: fall through to store search by hostname.
  }

  await setPendingSidepanelNav({ view: "store", query: hostnameQuery(href) });
  persistAppView("store");
};

const handleContextMenuClick = (
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab,
): void => {
  if (info.menuItemId !== MENU_ID) return;
  openNowlyPanel(tab);
  void resolveContextMenuNav(info, tab);
};

export const registerContextMenu = (): void => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: chrome.i18n.getMessage("contextMenuPage") || "Nowly",
      contexts: ["page", "video", "audio"],
    });
  });

  if (clickListenerBound) return;
  clickListenerBound = true;
  chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
};
