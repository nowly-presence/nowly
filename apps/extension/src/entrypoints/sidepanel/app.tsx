import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import { sendMessage } from "@/lib/messages"
import { BottomNav } from "@/components/layout/bottom-nav"
import { ConnectionStatusBar, isConnectionHealthy } from "@/components/layout/connection-status-bar"
import { Header } from "@/components/layout/header"
import { ActivityView } from "@/features/activity/activity-view"
import { CurrentActivityCard } from "@/features/activity/current-activity-card"
import { ScheduleDialog } from "@/features/activity/schedule-dialog"
import { SnoozeDialog } from "@/features/activity/snooze-dialog"
import { OnboardingOverlay } from "@/features/onboarding/onboarding-overlay"
import { RuntimeLogsView } from "@/features/runtime-logs/runtime-logs-view"
import type { SettingsSectionId } from "@/features/settings/settings-screen"
import { ExtensionStateProvider, useExtensionState } from "@/hooks/extension-state-provider"
import { useHostVersion } from "@/hooks/use-host-version"
import { useLocalePreference } from "@/hooks/use-locale-preference"
import { useOnboardingState } from "@/hooks/use-onboarding-state"
import { useTheme } from "@/hooks/use-theme"
import { trackUiEvent } from "@/lib/analytics"
import { WEB_BASE_URL } from "@/shared/constants"
import { t } from "@/shared/i18n"
import {
  SIDEPANEL_NAV_KEY,
  clearPendingSidepanelNav,
  isSidepanelPendingNav,
  loadPendingSidepanelNav,
  persistAppView,
  type SidepanelPendingNav,
} from "@/shared/sidepanel-view"
import type { AppView, PersistedAppView } from "@/shared/types"
import { Skeleton } from "@/ui/skeleton"

const StoreView = lazy(() => import("@/features/store/store-view").then((m) => ({ default: m.StoreView })))
const SettingsScreen = lazy(() => import("@/features/settings/settings-screen").then((m) => ({ default: m.SettingsScreen })))

const SidepanelViewSkeleton = ({ view }: { view: "store" | "settings" }): React.JSX.Element => (
  <div
    className="flex flex-col gap-3"
    aria-busy="true"
  >
    {view === "store" ? (
      <>
        <Skeleton className="h-24 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="size-9 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton
              key={index}
              className="h-44 rounded-xl"
            />
          ))}
        </div>
      </>
    ) : (
      <>
        <Skeleton className="h-16 rounded-xl" />
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton
              key={index}
              className="m-3 h-14 rounded-lg"
            />
          ))}
        </div>
      </>
    )}
  </div>
)

type StoreSeed = { query: string }

type StoreScreenProps = {
  seed: StoreSeed
  selectedSlug: string | null
  onSelectPresence: (slug: string | null) => void
}

const StoreScreen = ({ seed, selectedSlug, onSelectPresence }: StoreScreenProps): React.JSX.Element => {
  const state = useExtensionState()
  const [installingSlug, setInstallingSlug] = useState<string | null>(null)
  const [installFeedback, setInstallFeedback] = useState<"error" | "queued" | null>(null)

  const handleInstall = async (slug: string): Promise<void> => {
    setInstallFeedback(null)
    setInstallingSlug(slug)
    const result = await state.installPresenceFromApi(slug)
    setInstallingSlug(null)
    if (!result.ok) setInstallFeedback(result.queued ? "queued" : "error")
  }

  return (
    <div className="flex flex-col gap-3">
      {installFeedback === "error" ? <p className="text-xs text-destructive">{t("store-install-error")}</p> : null}
      {installFeedback === "queued" ? <p className="text-xs text-warning">{t("store-install-queued")}</p> : null}
      <StoreView
        installingSlug={installingSlug}
        installQueueCount={state.installQueue.length}
        onInstall={(slug) => void handleInstall(slug)}
        onOpenWebsite={(slug) => void chrome.tabs.create({ url: `${WEB_BASE_URL}/library/${slug}` })}
        onRetryQueue={() => void state.retryInstallQueue()}
        onSelectPresence={onSelectPresence}
        presences={state.presences}
        updates={state.updates}
        seedQuery={seed.query}
        selectedSlug={selectedSlug}
      />
    </div>
  )
}

type ActivityScreenProps = {
  selectedSlug: string | null
  onSelectPresence: (slug: string | null) => void
}

const ActivityScreen = ({ selectedSlug, onSelectPresence }: ActivityScreenProps): React.JSX.Element => {
  const state = useExtensionState()
  const [snoozeSlug, setSnoozeSlug] = useState<string | null>(null)
  const [scheduleSlug, setScheduleSlug] = useState<string | null>(null)
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null)
  const [installFeedback, setInstallFeedback] = useState<"error" | "queued" | null>(null)

  const activeSlug = state.activity?.slug ?? null
  const activePresence = activeSlug ? state.presences[activeSlug] : null
  const isSnoozed = Boolean(activePresence?.snoozeUntil && activePresence.snoozeUntil > Date.now())

  const handleUpdate = async (slug: string): Promise<void> => {
    setInstallFeedback(null)
    setUpdatingSlug(slug)
    const result = await state.installPresenceFromApi(slug)
    setUpdatingSlug(null)
    if (!result.ok) setInstallFeedback(result.queued ? "queued" : "error")
  }

  const idleHint =
    !state.activity &&
    state.settings.scheduleEnabled === true &&
    (Boolean(state.settings.globalSchedule) || Object.values(state.presences).some((presence) => Boolean(presence.schedule)))
      ? t("schedule-idle-hint")
      : undefined

  return (
    <div className="flex flex-col gap-4">
      {installFeedback === "error" ? <p className="text-xs text-destructive">{t("store-install-error")}</p> : null}
      {installFeedback === "queued" ? <p className="text-xs text-warning">{t("store-install-queued")}</p> : null}
      {state.settings.showPlayer !== false && !selectedSlug ? (
        <CurrentActivityCard
          activity={state.activity}
          idleHint={idleHint}
          isLoading={state.isLoading}
          isPaused={state.settings.presencePaused === true}
          isSnoozed={isSnoozed}
          presences={state.presences}
          onSnooze={() => activeSlug && setSnoozeSlug(activeSlug)}
          onUnsnooze={() => activeSlug && void sendMessage("CLEAR_SNOOZE", { slug: activeSlug })}
        />
      ) : null}

      <ActivityView
        entries={state.entries}
        isLoading={state.isLoading}
        settings={state.settings}
        updates={state.updates}
        updatingSlug={updatingSlug}
        selectedSlug={selectedSlug}
        onSelectPresence={onSelectPresence}
        onToggle={state.togglePresence}
        onRemove={state.removePresence}
        onSchedule={setScheduleSlug}
        onSnooze={setSnoozeSlug}
        onUpdatePresence={handleUpdate}
        onOpenWebsite={(slug) => void chrome.tabs.create({ url: `${WEB_BASE_URL}/library/${slug}` })}
      />

      <SnoozeDialog
        open={snoozeSlug !== null}
        activeSlug={snoozeSlug}
        presences={state.presences}
        onClose={() => setSnoozeSlug(null)}
      />
      <ScheduleDialog
        open={scheduleSlug !== null}
        activeSlug={scheduleSlug}
        globalSchedule={state.settings.globalSchedule}
        presences={state.presences}
        onClose={() => setScheduleSlug(null)}
      />
    </div>
  )
}

type ShellProps = {
  initialView: PersistedAppView
}

const Shell = ({ initialView }: ShellProps): React.JSX.Element => {
  const state = useExtensionState()

  const [view, setView] = useState<AppView>(initialView)

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  const [settingsSection, setSettingsSection] = useState<SettingsSectionId | null>(null)

  const [storeSeed, setStoreSeed] = useState<StoreSeed>({ query: "" })

  const [storeSelectedSlug, setStoreSelectedSlug] = useState<string | null>(null)

  useTheme(state.settings.appearance)

  const { localePreference, setLocalePreference } = useLocalePreference()
  const { onboarding, setOnboarding, nativeStatus: onboardingNativeStatus, userScripts } = useOnboardingState()

  const { hostVersionInfo } = useHostVersion()

  const onLocaleChange = (locale: typeof localePreference): void => {
    trackUiEvent("settings_language_changed")
    setLocalePreference(locale)
  }

  const presencePaused = state.settings.presencePaused === true

  const connectionHealthy = isConnectionHealthy(state.nativeStatus)

  const hostUpdateAvailable = hostVersionInfo?.updateAvailable === true

  const developerModeEnabled = state.settings.developerMode === true || state.isUnpacked

  useEffect(() => {
    if (view === "logs" && !developerModeEnabled) setView("settings")
  }, [developerModeEnabled, view])

  const [statusVisible, setStatusVisible] = useState(true)
  useEffect(() => {
    setStatusVisible(true)
    if (presencePaused || hostUpdateAvailable || !connectionHealthy) return
    const timer = window.setTimeout(() => setStatusVisible(false), 2500)
    return () => window.clearTimeout(timer)
  }, [connectionHealthy, hostUpdateAvailable, presencePaused])

  const changeView = (nextView: PersistedAppView | "logs"): void => {
    if (nextView === view) {
      if (nextView === "activity") setSelectedSlug(null)
      if (nextView === "store") setStoreSelectedSlug(null)
    }
    if (nextView === "settings") setSettingsSection(null)
    setView(nextView)
    persistAppView(nextView)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName))) return

      const views: Array<PersistedAppView | "logs"> = ["activity", "store", "settings"]
      if (developerModeEnabled) views.push("logs")

      const currentIndex = views.indexOf(view)
      if (currentIndex === -1) return
      const offset = event.key === "ArrowRight" ? 1 : -1
      const nextIndex = (currentIndex + offset + views.length) % views.length
      event.preventDefault()
      changeView(views[nextIndex])
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [developerModeEnabled, view])

  type NavSnapshot = {
    view: AppView
    selectedSlug: string | null
    storeSelectedSlug: string | null
    settingsSection: SettingsSectionId | null
  }
  // Keep detail state with each tab so browser side buttons can restore the exact panel state.
  const navHistory = useRef<NavSnapshot[]>([{ view: initialView, selectedSlug: null, storeSelectedSlug: null, settingsSection: null }])
  const navIndex = useRef(0)
  const skipHistoryPush = useRef(true)

  useEffect(() => {
    if (skipHistoryPush.current) {
      skipHistoryPush.current = false
      return
    }
    navHistory.current = [...navHistory.current.slice(0, navIndex.current + 1), { view, selectedSlug, storeSelectedSlug, settingsSection }]
    navIndex.current = navHistory.current.length - 1
  }, [view, selectedSlug, storeSelectedSlug, settingsSection])

  useEffect(() => {
    const onMouseUp = (event: MouseEvent): void => {
      if (event.button !== 3 && event.button !== 4) return
      const nextIndex = navIndex.current + (event.button === 3 ? -1 : 1)
      const snapshot = navHistory.current[nextIndex]
      if (!snapshot) return
      event.preventDefault()
      navIndex.current = nextIndex
      skipHistoryPush.current = true
      setView(snapshot.view)
      setSelectedSlug(snapshot.selectedSlug)
      setStoreSelectedSlug(snapshot.storeSelectedSlug)
      setSettingsSection(snapshot.settingsSection)
      persistAppView(snapshot.view)
    }
    window.addEventListener("mouseup", onMouseUp)
    return () => window.removeEventListener("mouseup", onMouseUp)
  }, [])

  const applyPendingNav = useCallback((nav: SidepanelPendingNav): void => {
    if (nav.view === "activity") {
      setSelectedSlug(nav.slug ?? null)
      changeView("activity")
      return
    }
    if (nav.view === "store") {
      setStoreSeed({ query: nav.query ?? "" })
      setStoreSelectedSlug(nav.slug ?? null)
      changeView("store")
      return
    }
    changeView(nav.view)
  }, [])

  useEffect(() => {
    void loadPendingSidepanelNav().then((nav) => {
      if (!nav) return
      applyPendingNav(nav)
      void clearPendingSidepanelNav()
    })

    const onStorageChanged = (changes: Record<string, chrome.storage.StorageChange>, areaName: string): void => {
      if (areaName !== "local" || !changes[SIDEPANEL_NAV_KEY]) return
      const nav = changes[SIDEPANEL_NAV_KEY].newValue
      if (!isSidepanelPendingNav(nav)) return
      applyPendingNav(nav)
      void clearPendingSidepanelNav()
    }
    chrome.storage.onChanged.addListener(onStorageChanged)
    return () => chrome.storage.onChanged.removeListener(onStorageChanged)
  }, [applyPendingNav])

  return (
    <div className="relative flex h-dvh flex-col bg-background text-foreground">
      {state.settings.backgroundAnimation !== false ? (
        <div
          className="sidepanel-bg absolute inset-0"
          aria-hidden
        />
      ) : null}
      <div className="relative z-1 flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col gap-4 overflow-hidden px-3 pt-3">
          <Header
            onTogglePause={() => state.setPresencePaused(!presencePaused)}
            presencePaused={presencePaused}
            onCheckUpdates={view === "activity" && !state.isUnpacked ? state.checkUpdates : undefined}
            isCheckingUpdates={state.isCheckingUpdates}
            onReplayOnboarding={() => void sendMessage("RESET_ONBOARDING_FOR_DEV")}
          />
          <ConnectionStatusBar
            nativeStatus={state.nativeStatus}
            onConnect={state.connectNative}
            presencePaused={presencePaused}
            hostUpdateAvailable={hostUpdateAvailable}
            visible={statusVisible}
          />
          <main
            id="sidepanel-tabpanel"
            className="-mx-1 -mt-1 flex-1 overflow-y-auto px-1 pt-1 pb-3"
            aria-label={t(
              view === "activity" ? "nav-home" : view === "store" ? "nav-store" : view === "logs" ? "runtime-logs-title" : "nav-settings",
            )}
          >
            {view === "activity" ? (
              <ActivityScreen
                selectedSlug={selectedSlug}
                onSelectPresence={setSelectedSlug}
              />
            ) : view === "logs" ? (
              <RuntimeLogsView />
            ) : (
              <Suspense fallback={<SidepanelViewSkeleton view={view === "store" ? "store" : "settings"} />}>
                {view === "store" ? (
                  <StoreScreen
                    seed={storeSeed}
                    selectedSlug={storeSelectedSlug}
                    onSelectPresence={setStoreSelectedSlug}
                  />
                ) : (
                  <SettingsScreen
                    section={settingsSection}
                    onSectionChange={setSettingsSection}
                  />
                )}
              </Suspense>
            )}
          </main>
        </div>
        <BottomNav
          activeView={view}
          onViewChange={changeView}
          developerModeEnabled={developerModeEnabled}
        />
      </div>

      <OnboardingOverlay
        activity={state.activity}
        nativeStatus={onboardingNativeStatus}
        userScripts={userScripts}
        devReplayOnboarding={onboarding.devReplayOnboarding}
        onboardingCompleted={onboarding.onboardingCompleted}
        localePreference={localePreference}
        onLocaleChange={onLocaleChange}
        onConnectNative={state.connectNative}
        onComplete={() => setOnboarding({ devReplayOnboarding: false, onboardingCompleted: true })}
        onSkipTour={() => {
          trackUiEvent("onboarding_skipped", { source: "extension_onboarding" })
          setOnboarding({ devReplayOnboarding: false, onboardingCompleted: true })
        }}
        presences={state.presences}
        settings={state.settings}
        hostVersionInfo={hostVersionInfo}
      />
    </div>
  )
}

type AppProps = {
  initialView: PersistedAppView
}

export const App = ({ initialView }: AppProps): React.JSX.Element => (
  <ExtensionStateProvider>
    <Shell initialView={initialView} />
  </ExtensionStateProvider>
)
