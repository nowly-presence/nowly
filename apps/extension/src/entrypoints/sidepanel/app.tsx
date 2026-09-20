import { useCallback, useEffect, useState } from "react"
import { sendMessage } from "@/lib/messages"
import { BottomNav } from "@/components/layout/bottom-nav"
import { ConnectionStatusBar, isConnectionHealthy } from "@/components/layout/connection-status-bar"
import { Header } from "@/components/layout/header"
import { ActivityView } from "@/features/activity/activity-view"
import { CurrentActivityCard } from "@/features/activity/current-activity-card"
import { ScheduleDialog } from "@/features/activity/schedule-dialog"
import { SnoozeDialog } from "@/features/activity/snooze-dialog"
import { OnboardingOverlay } from "@/features/onboarding/onboarding-overlay"
import { SettingsScreen } from "@/features/settings/settings-screen"
import { StoreView } from "@/features/store/store-view"
import { ExtensionStateProvider, useExtensionState } from "@/hooks/extension-state-provider"
import { useHostVersion } from "@/hooks/use-host-version"
import { useLocalePreference } from "@/hooks/use-locale-preference"
import { useOnboardingState } from "@/hooks/use-onboarding-state"
import { useTheme } from "@/hooks/use-theme"
import { trackUiEvent } from "@/lib/analytics"
import { WEB_BASE_URL } from "@/shared/constants"
import { t } from "@/shared/i18n"
import { SIDEPANEL_NAV_KEY, clearPendingSidepanelNav, isSidepanelPendingNav, loadPendingSidepanelNav, persistAppView, type SidepanelPendingNav } from "@/shared/sidepanel-view"
import type { PersistedAppView } from "@/shared/types"

type StoreSeed = { query: string; slug: string | null }

type StoreScreenProps = {
  seed: StoreSeed
}

const StoreScreen = ({ seed }: StoreScreenProps): React.JSX.Element => {
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
        onRetryQueue={() => void state.retryInstallQueue()}
        presences={state.presences}
        updates={state.updates}
        seedQuery={seed.query}
        seedSlug={seed.slug}
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
    !state.activity && state.settings.scheduleEnabled === true && (Boolean(state.settings.globalSchedule) || Object.values(state.presences).some((presence) => Boolean(presence.schedule)))
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
        onUpdatePresence={handleUpdate}
        onOpenWebsite={(slug) => void chrome.tabs.create({ url: `${WEB_BASE_URL}/library/${slug}` })}
      />

      <SnoozeDialog open={snoozeSlug !== null} activeSlug={snoozeSlug} presences={state.presences} onClose={() => setSnoozeSlug(null)} />
      <ScheduleDialog open={scheduleSlug !== null} activeSlug={scheduleSlug} globalSchedule={state.settings.globalSchedule} presences={state.presences} onClose={() => setScheduleSlug(null)} />
    </div>
  )
}

type ShellProps = {
  initialView: PersistedAppView
}

const Shell = ({ initialView }: ShellProps): React.JSX.Element => {
  const state = useExtensionState()
  const [view, setView] = useState<PersistedAppView>(initialView)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [storeSeed, setStoreSeed] = useState<StoreSeed>({ query: "", slug: null })
  useTheme(state.settings.appearance)

  const { localePreference, setLocalePreference } = useLocalePreference()
  const { onboarding, setOnboarding, nativeStatus: onboardingNativeStatus, userScripts } = useOnboardingState()
  const { hostVersionInfo } = useHostVersion()

  const onLocaleChange = (locale: typeof localePreference): void => {
    trackUiEvent("settings_language_changed")
    setLocalePreference(locale)
  }

  const changeView = (nextView: PersistedAppView): void => {
    setView(nextView)
    persistAppView(nextView)
  }

  // Applied when the right-click "Nowly presence for this page" context menu
  // (or the store card's "open library entry") asks the panel to jump to a
  // specific presence/search after it opens.
  const applyPendingNav = useCallback((nav: SidepanelPendingNav): void => {
    if (nav.view === "activity") {
      setSelectedSlug(nav.slug ?? null)
      changeView("activity")
      return
    }
    if (nav.view === "store") {
      setStoreSeed({ query: nav.query ?? "", slug: nav.slug ?? null })
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
      {state.settings.backgroundAnimation !== false ? <div className="sidepanel-bg absolute inset-0" aria-hidden /> : null}
      <div className="relative z-1 flex flex-1 flex-col overflow-hidden">
        <ConnectionStatusBar
          nativeStatus={state.nativeStatus}
          onConnect={state.connectNative}
          presencePaused={state.settings.presencePaused === true}
          visible={!isConnectionHealthy(state.nativeStatus) || state.settings.presencePaused === true}
        />
        <div className="flex flex-1 flex-col gap-4 overflow-hidden px-3 pt-3">
          <Header
            displayMode={view === "activity" ? state.settings.presenceDisplayMode : undefined}
            onDisplayModeChange={view === "activity" ? (mode) => state.setSettings({ presenceDisplayMode: mode }) : undefined}
            onTogglePause={() => state.setPresencePaused(!(state.settings.presencePaused === true))}
            presencePaused={state.settings.presencePaused === true}
            onCheckUpdates={view === "activity" && !state.isUnpacked ? state.checkUpdates : undefined}
            isCheckingUpdates={state.isCheckingUpdates}
            onReplayOnboarding={() => void sendMessage("RESET_ONBOARDING_FOR_DEV")}
          />
          <main id="sidepanel-tabpanel" className="flex-1 overflow-y-auto pb-3" aria-label={t(view === "activity" ? "nav-home" : view === "store" ? "nav-store" : "nav-settings")}>
            {view === "activity" ? (
              <ActivityScreen selectedSlug={selectedSlug} onSelectPresence={setSelectedSlug} />
            ) : view === "store" ? (
              <StoreScreen seed={storeSeed} />
            ) : (
              <SettingsScreen />
            )}
          </main>
        </div>
        <BottomNav activeView={view} onViewChange={changeView} />
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
