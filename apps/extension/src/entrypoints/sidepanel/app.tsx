import { useState } from "react"
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
import type { PersistedAppView } from "@/shared/types"

const StoreScreen = (): React.JSX.Element => {
  const state = useExtensionState()
  const [installingSlug, setInstallingSlug] = useState<string | null>(null)

  const handleInstall = (slug: string): void => {
    setInstallingSlug(slug)
    void state.installPresenceFromApi(slug).finally(() => setInstallingSlug(null))
  }

  return (
    <StoreView
      installingSlug={installingSlug}
      installQueueCount={state.installQueue.length}
      onInstall={handleInstall}
      onRetryQueue={() => void state.retryInstallQueue()}
      presences={state.presences}
      updates={state.updates}
    />
  )
}

const ActivityScreen = (): React.JSX.Element => {
  const state = useExtensionState()
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [snoozeSlug, setSnoozeSlug] = useState<string | null>(null)
  const [scheduleSlug, setScheduleSlug] = useState<string | null>(null)
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null)

  const activeSlug = state.activity?.slug ?? null
  const activePresence = activeSlug ? state.presences[activeSlug] : null
  const isSnoozed = Boolean(activePresence?.snoozeUntil && activePresence.snoozeUntil > Date.now())

  const handleUpdate = (slug: string): void => {
    setUpdatingSlug(slug)
    void state.installPresenceFromApi(slug).finally(() => setUpdatingSlug(null))
  }

  return (
    <div className="flex flex-col gap-4">
      <CurrentActivityCard
        activity={state.activity}
        isLoading={state.isLoading}
        isPaused={state.settings.presencePaused === true}
        isSnoozed={isSnoozed}
        presences={state.presences}
        onSnooze={() => activeSlug && setSnoozeSlug(activeSlug)}
        onUnsnooze={() => activeSlug && void sendMessage("CLEAR_SNOOZE", { slug: activeSlug })}
      />

      <ActivityView
        entries={state.entries}
        isLoading={state.isLoading}
        settings={state.settings}
        updates={state.updates}
        updatingSlug={updatingSlug}
        selectedSlug={selectedSlug}
        onSelectPresence={setSelectedSlug}
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

const Shell = (): React.JSX.Element => {
  const state = useExtensionState()
  const [view, setView] = useState<PersistedAppView>("activity")
  useTheme(state.settings.appearance)

  const { localePreference, setLocalePreference } = useLocalePreference()
  const { onboarding, setOnboarding, nativeStatus: onboardingNativeStatus, userScripts } = useOnboardingState()
  const { hostVersionInfo } = useHostVersion()

  const onLocaleChange = (locale: typeof localePreference): void => {
    trackUiEvent("settings_language_changed")
    setLocalePreference(locale)
  }

  return (
    <div className="relative flex h-dvh flex-col bg-background text-foreground">
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
        />
        <main id="sidepanel-tabpanel" className="flex-1 overflow-y-auto pb-3" aria-label={t(view === "activity" ? "nav-home" : view === "store" ? "nav-store" : "nav-settings")}>
          {view === "activity" ? <ActivityScreen /> : view === "store" ? <StoreScreen /> : <SettingsScreen />}
        </main>
      </div>
      <BottomNav activeView={view} onViewChange={setView} />

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

export const App = (): React.JSX.Element => (
  <ExtensionStateProvider>
    <Shell />
  </ExtensionStateProvider>
)
