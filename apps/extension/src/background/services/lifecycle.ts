import { broadcastActiveTab, handleClearActivity, handleRemovedTab, restoreActivityBadge } from "@/background/managers/activity-manager"
import { drainInstallQueue, installBundledPresences } from "@/background/managers/presence-manager"
import { trackAnalytics } from "@/background/analytics-client"
import { addRuntimeLog } from "@/background/runtime-logs"
import { refreshPresenceLanguage, syncPresenceScripts } from "@/background/runtime/presence-scripts"
import { initializeCustomApiUrl } from "@/background/services/api-state"
import { setFocusedTabId } from "@/background/services/background-context"
import { registerContextMenu } from "@/background/services/context-menu"
import { syncDeviceState, syncUninstallUrl } from "@/background/services/device-sync"
import { connectNative, onNativeResponse } from "@/background/services/native"
import { getPresences, setDebug } from "@/background/storage/presences.store"
import { IS_CANARY } from "@/shared/brand"
import { WEB_BASE_URL } from "@/shared/constants"
import { LOCALE_PREFERENCE_KEY } from "@/shared/locales"
import type { InstalledPresences } from "@/shared/types"

type ChromeWithSidePanel = typeof chrome & {
  sidePanel?: { setPanelBehavior(options: { openPanelOnActionClick: boolean }): Promise<void> }
}

type ChromeWithSidebarAction = typeof chrome & {
  sidebarAction?: { toggle(): void }
}

const enableSidePanelAction = (): void => {
  if (import.meta.env.BROWSER === "firefox") {
    chrome.action.onClicked.addListener(() => {
      ;(chrome as ChromeWithSidebarAction).sidebarAction?.toggle()
    })
    return
  }

  const sidePanel = (chrome as ChromeWithSidePanel).sidePanel
  if (!sidePanel) return

  void sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
  })
}

type HeartbeatLogState = {
  connected: boolean
  status: string
  version?: string
}
export const hasHeartbeatLogChanged = (
  previous: HeartbeatLogState | undefined,
  current: HeartbeatLogState,
): boolean =>
  !previous ||
  previous.connected !== current.connected ||
  previous.status !== current.status ||
  previous.version !== current.version

let lastHeartbeatConnected: boolean | undefined
let lastHeartbeatLogState: HeartbeatLogState | undefined

const registerNativeResponseHandler = (): void => {
  onNativeResponse((message) => {
    if (message.type === "ERROR") {
      addRuntimeLog("error", "native", "native error", { reason: message.error })
      if (lastHeartbeatConnected !== false) {
        trackAnalytics("native_heartbeat_failed", { payload: { reason: message.error } })
      }
      lastHeartbeatConnected = false
      void setDebug({ stage: "native-error", message: message.error, updatedAt: Date.now() })
      return
    }

    if (message.type === "CONNECTED") {
      addRuntimeLog("success", "native", "native connected", { nativeVersion: message.version })
      trackAnalytics("native_connected")
    }

    if (message.type === "PONG") {
      const heartbeatState: HeartbeatLogState = {
        connected: message.connected,
        status: message.status,
        version: message.version,
      }
      if (hasHeartbeatLogChanged(lastHeartbeatLogState, heartbeatState)) {
        addRuntimeLog(message.connected ? "success" : "warn", "native", "native heartbeat", {
          connected: message.connected,
          status: message.status,
          nativeVersion: message.version,
        })
        lastHeartbeatLogState = heartbeatState
      }

      if (!message.connected && lastHeartbeatConnected !== false) {
        trackAnalytics("native_heartbeat_failed", { payload: { reason: message.status } })
      }
      lastHeartbeatConnected = message.connected
    }

    if (message.type === "OK") {
      void setDebug({ stage: "native", message: "discord activity accepted", updatedAt: Date.now() })
    }
  })
}

const openChangelogOnUpdate = (details: chrome.runtime.InstalledDetails): void => {
  if (details.reason !== "update") return
  if (IS_CANARY) return

  const version = chrome.runtime.getManifest().version
  const webBaseUrl = WEB_BASE_URL.replace(/\/$/, "")
  void chrome.tabs.create({ url: `${webBaseUrl}/changelog/${version}` })
}

const detectFocusedTab = async (): Promise<void> => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (tab?.id != null) setFocusedTabId(tab.id)
}

let bootPromise: Promise<InstalledPresences> | null = null

const runBootBackground = async (options: { restoreBadge?: boolean; syncScripts?: boolean }): Promise<InstalledPresences> => {
  await detectFocusedTab()
  await handleClearActivity()
  connectNative()
  await initializeCustomApiUrl()
  await syncUninstallUrl()
  await installBundledPresences()
  const presences = await getPresences()
  await syncDeviceState()
  void drainInstallQueue()
  if (options.restoreBadge) await restoreActivityBadge()
  if (options.syncScripts !== false) await syncPresenceScripts(presences)
  return presences
}

const bootBackground = (options: { restoreBadge?: boolean; syncScripts?: boolean } = {}): Promise<InstalledPresences> => {
  bootPromise ??= runBootBackground(options)
  return bootPromise
}

export const registerLifecycleHandlers = (): void => {
  registerNativeResponseHandler()

  chrome.runtime.onStartup.addListener(async () => {
    enableSidePanelAction()
    registerContextMenu()
    await bootBackground({ restoreBadge: true })
  })

  chrome.runtime.onInstalled.addListener(async (details) => {
    enableSidePanelAction()
    registerContextMenu()
    if (details.reason === "install") trackAnalytics("extension_install", { source: "system" })
    if (details.reason === "update") trackAnalytics("extension_update", { source: "system" })
    const presences = await bootBackground({ syncScripts: false })
    openChangelogOnUpdate(details)
    await syncPresenceScripts(presences)
  })

  if (import.meta.env.BROWSER === "firefox") {
    chrome.permissions.onAdded.addListener((permissions) => {
      if (!permissions.permissions?.includes("userScripts")) return
      void getPresences().then((presences) => syncPresenceScripts(presences))
    })
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && LOCALE_PREFERENCE_KEY in changes) void refreshPresenceLanguage()
  })

  chrome.tabs.onRemoved.addListener(handleRemovedTab)

  chrome.tabs.onActivated.addListener(({ tabId }) => {
    setFocusedTabId(tabId)
    void broadcastActiveTab()
  })

  chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) return
    chrome.tabs.query({ active: true, windowId }, (tabs) => {
      const tabId = tabs[0]?.id
      if (tabId == null) return
      setFocusedTabId(tabId)
      void broadcastActiveTab()
    })
  })
}

export const initializeBackground = (): void => {
  enableSidePanelAction()
  registerContextMenu()
  void bootBackground()
}
