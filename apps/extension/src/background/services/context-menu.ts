import { broadcastActiveTab } from "@/background/managers/activity-manager"
import { fetchPresenceCatalog } from "@/background/managers/presence-manager"
import { urlMatchesPresence } from "@/shared/url-patterns"
import {
  getFocusedTabId,
  getTabPresence,
  isTabMuted,
  onBroadcastStateChanged,
  removeTabPresence,
  setTabMuted,
} from "@/background/services/background-context"
import { openNowlyPanel } from "@/background/services/open-panel"
import { getPresences } from "@/background/storage/presences.store"
import { persistAppView, setPendingSidepanelNav } from "@/shared/sidepanel-view"

const MENU_ID = "nowly-page-presence"
const MUTE_MENU_ID = "nowly-mute-tab"
const muteTitle = (): string => chrome.i18n.getMessage("contextMenuMuteTab") || "Don't share this tab"
const unmuteTitle = (): string => chrome.i18n.getMessage("contextMenuUnmuteTab") || "Share this tab"

let clickListenerBound = false
let menuRegistrationPromise: Promise<void> | null = null

const removeAllContextMenus = (): Promise<void> =>
  new Promise((resolve, reject) => {
    chrome.contextMenus.removeAll(() => {
      const error = chrome.runtime.lastError
      if (error) {
        reject(new Error(error.message))
        return
      }
      resolve()
    })
  })

const createContextMenu = (properties: chrome.contextMenus.CreateProperties): Promise<void> =>
  new Promise((resolve, reject) => {
    try {
      chrome.contextMenus.create(properties, () => {
        const error = chrome.runtime.lastError
        if (error) {
          reject(new Error(error.message))
          return
        }
        resolve()
      })
    } catch (error) {
      reject(error)
    }
  })

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
  }

  await setPendingSidepanelNav({ view: "store", query: hostnameQuery(href) })
  persistAppView("store")
}

export const requestImmediateTick = async (tabId: number): Promise<void> => {
  const tab = await chrome.tabs.get(tabId).catch(() => undefined)
  if (!tab?.url) return

  const presences = await getPresences()
  for (const [slug, stored] of Object.entries(presences)) {
    if (!stored.enabled || !urlMatchesPresence(tab.url, stored.metadata.url)) continue
    chrome.tabs.sendMessage(tabId, { type: "PRESENCE_SETTINGS_UPDATED", slug, settings: {} }).catch(() => {})
  }
}

export const setTabMuteState = async (tabId: number, muted: boolean): Promise<void> => {
  await setTabMuted(tabId, muted)
  if (muted) {
    await removeTabPresence(tabId)
  } else {
    void requestImmediateTick(tabId)
  }
  await broadcastActiveTab()
}

const toggleTabMute = async (tabId: number): Promise<void> => setTabMuteState(tabId, !(await isTabMuted(tabId)))

const syncMuteMenuItem = async (): Promise<void> => {
  const tabId = getFocusedTabId()
  const muted = tabId != null && (await isTabMuted(tabId))
  const hasActivePresence = tabId != null && Boolean(await getTabPresence(tabId))

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

const registerMenus = async (): Promise<void> => {
  await removeAllContextMenus()
  await createContextMenu({
    id: MENU_ID,
    title: chrome.i18n.getMessage("contextMenuPage") || "Nowly",
    contexts: ["page", "video", "audio"],
  })
  await createContextMenu({
    id: MUTE_MENU_ID,
    title: muteTitle(),
    contexts: ["page", "video", "audio"],
    enabled: false,
  })
  await syncMuteMenuItem()
}

export const registerContextMenu = (): void => {
  if (!menuRegistrationPromise) {
    menuRegistrationPromise = registerMenus().catch((error: unknown) => {
      menuRegistrationPromise = null
      console.error("Failed to register context menus", error)
    })
  }

  if (clickListenerBound) return
  clickListenerBound = true
  chrome.contextMenus.onClicked.addListener(handleContextMenuClick)
  onBroadcastStateChanged(() => void syncMuteMenuItem())
}
