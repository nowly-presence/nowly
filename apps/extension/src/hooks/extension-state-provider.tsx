import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { sendMessage } from "@/lib/messages"
import type { CurrentActivity, ExtensionSettings, InstalledPresences, NativeStatus, PresenceDebug } from "@/shared/types"

type ExtensionState = {
  activity: CurrentActivity | null
  debug: PresenceDebug | null
  entries: Array<[string, InstalledPresences[string]]>
  installQueue: string[]
  isLoading: boolean
  isUnpacked: boolean
  nativeStatus: NativeStatus
  presences: InstalledPresences
  analyticsConsent: boolean
  settings: ExtensionSettings
  updates: Record<string, string>
  isCheckingUpdates: boolean
  checkUpdates: () => void
  refresh: () => void
  connectNative: () => void
  isConnectingNative: boolean
  removePresence: (slug: string) => void
  togglePresence: (slug: string, enabled: boolean) => void
  bulkRemovePresences: (slugs: string[]) => void
  bulkTogglePresences: (slugs: string[], enabled: boolean) => void
  installPresenceFromApi: (slug: string) => Promise<{ ok: boolean; queued: boolean }>
  retryInstallQueue: () => Promise<void>
  setPresencePaused: (paused: boolean) => void
  setSettings: (partial: Partial<ExtensionSettings>) => void
  setAnalyticsConsent: (granted: boolean) => void
}

const FALLBACK_NATIVE_STATUS: NativeStatus = { connected: false, status: "unknown", discordConnected: false }

const FALLBACK_SETTINGS: ExtensionSettings = {
  presenceDisplayMode: "category",
  showPlayer: true,
  scheduleEnabled: false,
}

const ExtensionStateContext = createContext<ExtensionState | null>(null)

export const ExtensionStateProvider = ({ children }: { children: ReactNode }): React.JSX.Element => {
  const [presences, setPresences] = useState<InstalledPresences>({})
  const [activity, setActivity] = useState<CurrentActivity | null>(null)
  const [debug, setDebugState] = useState<PresenceDebug | null>(null)
  const [nativeStatus, setNativeStatus] = useState<NativeStatus>(FALLBACK_NATIVE_STATUS)
  const [settings, setSettingsState] = useState<ExtensionSettings>(FALLBACK_SETTINGS)
  const [analyticsConsent, setAnalyticsConsentState] = useState(false)
  const [installQueue, setInstallQueue] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUnpacked, setIsUnpacked] = useState(false)
  const [updates, setUpdates] = useState<Record<string, string>>({})
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false)
  const [isConnectingNative, setIsConnectingNative] = useState(false)
  const connectingNativeRef = useRef(false)
  const visibleTriggeredRef = useRef(false)

  useEffect(() => {
    try {
      setIsUnpacked(!chrome.runtime.getManifest().update_url)
    } catch {
      setIsUnpacked(false)
    }
  }, [])

  const entries = useMemo(() => Object.entries(presences), [presences])

  const refresh = useCallback((): void => {
    void Promise.all([
      sendMessage("GET_PRESENCES"),
      sendMessage("GET_CURRENT_ACTIVITY"),
      sendMessage("GET_NATIVE_STATUS"),
      sendMessage("GET_DEBUG"),
      sendMessage("GET_SETTINGS"),
      sendMessage("GET_INSTALL_QUEUE"),
      sendMessage("GET_ANALYTICS_CONSENT"),
    ])
      .then(([nextPresences, nextActivity, nextNativeStatus, nextDebug, nextSettings, nextQueue, nextConsent]) => {
        setPresences(nextPresences ?? {})
        setActivity(nextActivity ?? null)
        setNativeStatus(nextNativeStatus ?? FALLBACK_NATIVE_STATUS)
        setDebugState(nextDebug ?? null)
        setSettingsState(nextSettings ?? FALLBACK_SETTINGS)
        setInstallQueue((nextQueue?.items ?? []).map((item) => item.slug))
        setAnalyticsConsentState(nextConsent?.granted === true)
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    refresh()
    // Safety net: chrome.storage.onChanged / the PRESENCES_CHANGED broadcast
    // cover normal mutations, this just guards against a missed event.
    const interval = window.setInterval(refresh, 3_600_000)

    const onStorageChanged = (changes: Record<string, chrome.storage.StorageChange>, areaName: string): void => {
      if (areaName !== "local") return
      if (changes.presences || changes.settings || changes.currentActivity || changes.presenceDebug || changes.presenceInstallQueue)
        refresh()
    }
    chrome.storage.onChanged.addListener(onStorageChanged)

    const onRuntimeMessage = (message: Record<string, unknown>): void => {
      if (message.source === "PRESENCES_BACKGROUND" && message.type === "PRESENCES_CHANGED") refresh()
    }
    chrome.runtime.onMessage.addListener(onRuntimeMessage)

    const onVisible = (): void => {
      if (document.visibilityState !== "visible") return
      // "visibilitychange" and "focus" both fire for the same real event (panel regaining
      // focus), which duplicated the native heartbeat request — dedupe within a short window.
      if (visibleTriggeredRef.current) return
      visibleTriggeredRef.current = true
      window.setTimeout(() => {
        visibleTriggeredRef.current = false
      }, 300)
      void sendMessage("CONNECT_NATIVE").then((status) => setNativeStatus(status ?? FALLBACK_NATIVE_STATUS))
      refresh()
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)

    return () => {
      window.clearInterval(interval)
      chrome.storage.onChanged.removeListener(onStorageChanged)
      chrome.runtime.onMessage.removeListener(onRuntimeMessage)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onVisible)
    }
  }, [refresh])

  const togglePresence = useCallback((slug: string, enabled: boolean): void => {
    void sendMessage("TOGGLE_PRESENCE", { slug, enabled }).then(() => {
      setPresences((current) => (current[slug] ? { ...current, [slug]: { ...current[slug], enabled } } : current))
    })
  }, [])

  const removePresence = useCallback((slug: string): void => {
    void sendMessage("UNINSTALL_PRESENCE", { slug }).then(() => {
      setPresences((current) => {
        const next = { ...current }
        delete next[slug]
        return next
      })
    })
  }, [])

  const bulkTogglePresences = useCallback((slugs: string[], enabled: boolean): void => {
    void sendMessage("BULK_TOGGLE_PRESENCE", { slugs, enabled }).then(() => refresh())
  }, [refresh])

  const bulkRemovePresences = useCallback((slugs: string[]): void => {
    void sendMessage("BULK_UNINSTALL_PRESENCE", { slugs }).then(() => refresh())
  }, [refresh])

  const installPresenceFromApi = useCallback(
    (slug: string): Promise<{ ok: boolean; queued: boolean }> =>
      sendMessage("INSTALL_PRESENCE_FROM_API", { slug }).then((result) => ({ ok: result?.ok === true, queued: result?.queued === true })),
    [],
  )

  const retryInstallQueue = useCallback(async (): Promise<void> => {
    await sendMessage("RETRY_INSTALL_QUEUE")
    refresh()
  }, [refresh])

  const setPresencePaused = useCallback((paused: boolean): void => {
    void sendMessage("SET_PRESENCE_PAUSE", { paused }).then((result) => {
      if (typeof result?.paused === "boolean") setSettingsState((current) => ({ ...current, presencePaused: result.paused }))
    })
  }, [])

  const connectNative = useCallback((): void => {
    if (connectingNativeRef.current) return
    connectingNativeRef.current = true
    setIsConnectingNative(true)
    setNativeStatus((current) => ({ ...current, status: "connecting" }))
    // CONNECT_NATIVE resolves almost instantly (the real handshake continues in the
    // background), so a minimum delay keeps the spinner visible long enough to register.
    void Promise.all([sendMessage("CONNECT_NATIVE"), new Promise((resolve) => setTimeout(resolve, 500))])
      .then(([status]) => setNativeStatus(status ?? FALLBACK_NATIVE_STATUS))
      .finally(() => {
        connectingNativeRef.current = false
        setIsConnectingNative(false)
      })
  }, [])

  const setSettings = useCallback((partial: Partial<ExtensionSettings>): void => {
    void sendMessage("SET_SETTINGS", partial).then((next) => {
      if (next) setSettingsState(next)
    })
  }, [])

  const setAnalyticsConsent = useCallback((granted: boolean): void => {
    void sendMessage("SET_ANALYTICS_CONSENT", { granted }).then((next) => setAnalyticsConsentState(next?.granted === true))
  }, [])

  const checkUpdates = useCallback((): void => {
    if (isUnpacked) return
    setIsCheckingUpdates(true)
    void sendMessage("CHECK_UPDATES")
      .then((next) => setUpdates(next ?? {}))
      .finally(() => setIsCheckingUpdates(false))
  }, [isUnpacked])

  const value: ExtensionState = {
    activity,
    debug,
    entries,
    installQueue,
    isLoading,
    isUnpacked,
    nativeStatus,
    presences,
    analyticsConsent,
    settings,
    updates,
    isCheckingUpdates,
    checkUpdates,
    refresh,
    connectNative,
    isConnectingNative,
    removePresence,
    togglePresence,
    bulkRemovePresences,
    bulkTogglePresences,
    installPresenceFromApi,
    retryInstallQueue,
    setPresencePaused,
    setSettings,
    setAnalyticsConsent,
  }

  return <ExtensionStateContext.Provider value={value}>{children}</ExtensionStateContext.Provider>
}

export const useExtensionState = (): ExtensionState => {
  const context = useContext(ExtensionStateContext)
  if (!context) throw new Error("useExtensionState must be used within an ExtensionStateProvider")
  return context
}
