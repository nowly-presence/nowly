import { broadcastActiveTab } from "@/background/managers/activity-manager"
import { fetchPresenceCatalog } from "@/background/managers/presence-manager"
import { urlMatchesPresence } from "@/background/runtime/url-match"
import { getFocusedTabId, getTabPresence, isTabMuted, onBroadcastStateChanged, removeTabPresence, setTabMuted } from "@/background/services/background-context"
import { openNowlyPanel } from "@/background/services/open-panel"
import { getPresences } from "@/background/storage/presences.store"
import { persistAppView, setPendingSidepanelNav } from "@/shared/sidepanel-view"

const MENU_ID = "nowly-page-presence"
const MUTE_MENU_ID = "nowly-mute-tab"
const muteTitle = (): string => chrome.i18n.getMessage("contextMenuMuteTab") || "Don't share this tab"
const unmuteTitle = (): string => chrome.i18n.getMessage("contextMenuUnmuteTab") || "Share this tab"

let clickListenerBound = false

const hostnameQuery = (href: string): string => {
  try {
    return new URL(href).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

const resolveContextMenuNav = async (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab): Promise<void> => {
  const href = tab?.url ?? info.pageUrl
  if (!href) {
    await setPendingSidepanelNav({ view: "store" })
    persistAppView("store")
    return
  }

  const presences = await getPresences()
  const installed = Object.entries(presences).find(([, presence]) => urlMatchesPresence(href, presence.metadata.url))

  if (installed) {
    await setPendingSidepanelNav({ view: "activity", slug: installed[0] })
    persistAppView("activity")
    return
  }

  try {
    const catalog = await fetchPresenceCatalog()
    const catalogMatch = catalog.find((item) => urlMatchesPresence(href, item.url))
    if (catalogMatch) {
      await setPendingSidepanelNav({ view: "store", slug: catalogMatch.slug })
      persistAppView("store")
      return
    }
  } catch {
    // Offline: fall through to store search by hostname.
  }

  await setPendingSidepanelNav({ view: "store", query: hostnameQuery(href) })
  persistAppView("store")
}

// Forces the injected presence script(s) to re-tick immediately instead of
// waiting up to 5s for their next natural interval, by reusing the same
// "settings updated" bridge the router sends on settings changes
// (presence-runtime.ts calls tick() unconditionally on receipt).
const requestImmediateTick = async (tabId: number): Promise<void> => {
  const tab = await chrome.tabs.get(tabId).catch(() => undefined)
  if (!tab?.url) return

  const presences = await getPresences()
  for (const [slug, stored] of Object.entries(presences)) {
    if (!stored.enabled || !urlMatchesPresence(tab.url, stored.metadata.url)) continue
    chrome.tabs.sendMessage(tabId, { type: "PRESENCE_SETTINGS_UPDATED", slug, settings: {} }).catch(() => {})
  }
}

const toggleTabMute = async (tabId: number): Promise<void> => {
  const muted = !(await isTabMuted(tabId))
  await setTabMuted(tabId, muted)
  if (muted) {
    removeTabPresence(tabId)
  } else {
    void requestImmediateTick(tabId)
  }
  await broadcastActiveTab()
}

// Reflects the currently focused tab's mute/presence state on the single menu
// item, since Chrome has no per-tab dynamic menu rendering to hook into.
const syncMuteMenuItem = async (): Promise<void> => {
  const tabId = getFocusedTabId()
  const muted = tabId != null && (await isTabMuted(tabId))
  const hasActivePresence = tabId != null && Boolean(getTabPresence(tabId))

  chrome.contextMenus.update(MUTE_MENU_ID, {
    title: muted ? unmuteTitle() : muteTitle(),
    enabled: muted || hasActivePresence,
  })
}

const handleContextMenuClick = (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab): void => {
  if (info.menuItemId === MUTE_MENU_ID) {
    if (tab?.id == null) return
    void toggleTabMute(tab.id)
    return
  }

  if (info.menuItemId !== MENU_ID) return
  openNowlyPanel(tab)
  void resolveContextMenuNav(info, tab)
}

export const registerContextMenu = (): void => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: chrome.i18n.getMessage("contextMenuPage") || "Nowly",
      contexts: ["page", "video", "audio"],
    })
    chrome.contextMenus.create({
      id: MUTE_MENU_ID,
      title: muteTitle(),
      contexts: ["page", "video", "audio"],
      enabled: false,
    })
    void syncMuteMenuItem()
  })

  if (clickListenerBound) return
  clickListenerBound = true
  chrome.contextMenus.onClicked.addListener(handleContextMenuClick)
  onBroadcastStateChanged(() => void syncMuteMenuItem())
}
