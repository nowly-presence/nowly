import { useEffect, useState } from "react"
import { ScheduleDialog } from "@/features/activity/schedule-dialog"
import { ActivitySelectionSection } from "@/features/settings/sections/activity-selection-section"
import { AppearanceSection } from "@/features/settings/sections/appearance-section"
import { DeveloperSection } from "@/features/settings/sections/developer-section"
import { LanguageSection } from "@/features/settings/sections/language-section"
import { NativeConnectionSection } from "@/features/settings/sections/native-connection-section"
import { PrivacySection } from "@/features/settings/sections/privacy-section"
import { ScheduleSection } from "@/features/settings/sections/schedule-section"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useHostVersion } from "@/hooks/use-host-version"
import { useLocalePreference } from "@/hooks/use-locale-preference"
import { sendMessage } from "@/lib/messages"
import type { UserScriptsStatus } from "@/shared/types"
import { Accordion } from "@/ui/accordion"
import { Skeleton } from "@/ui/skeleton"

const FALLBACK_USER_SCRIPTS_STATUS: UserScriptsStatus = { enabled: false, requiresUserToggle: true }

export const SettingsScreen = (): React.JSX.Element => {
  const state = useExtensionState()
  const { localePreference, setLocalePreference } = useLocalePreference()
  const { hostVersionInfo, isCheckingHostVersion, checkHostUpdate } = useHostVersion()
  const [globalScheduleOpen, setGlobalScheduleOpen] = useState(false)
  const [userScripts, setUserScripts] = useState<UserScriptsStatus>(FALLBACK_USER_SCRIPTS_STATUS)

  useEffect(() => {
    void sendMessage("GET_USER_SCRIPTS_STATUS").then((status) => setUserScripts(status ?? FALLBACK_USER_SCRIPTS_STATUS))
  }, [])

  if (state.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Accordion defaultValue={["appearance"]}>
        <AppearanceSection localePreference={localePreference} onLocaleChange={setLocalePreference} settings={state.settings} onSettingsChange={state.setSettings} />
        <PrivacySection settings={state.settings} onSettingsChange={state.setSettings} analyticsConsent={state.analyticsConsent} onAnalyticsConsentChange={state.setAnalyticsConsent} />
        <ActivitySelectionSection settings={state.settings} onSettingsChange={state.setSettings} presences={state.presences} />
        <ScheduleSection settings={state.settings} onSettingsChange={state.setSettings} onEditGlobalSchedule={() => setGlobalScheduleOpen(true)} />
        <LanguageSection settings={state.settings} onSettingsChange={state.setSettings} />
        <NativeConnectionSection
          activity={state.activity}
          presences={state.presences}
          userScripts={userScripts}
          nativeStatus={state.nativeStatus}
          hostVersionInfo={hostVersionInfo}
          isCheckingHostVersion={isCheckingHostVersion}
          onCheckHostUpdate={() => void checkHostUpdate()}
          onConnect={state.connectNative}
        />
        <DeveloperSection
          settings={state.settings}
          onSettingsChange={state.setSettings}
          isUnpacked={state.isUnpacked}
          debug={state.debug}
          nativeStatus={state.nativeStatus}
          isCheckingUpdates={state.isCheckingUpdates}
          onCheckUpdates={state.checkUpdates}
          onReplayOnboarding={() => void sendMessage("RESET_ONBOARDING_FOR_DEV")}
        />
      </Accordion>

      <ScheduleDialog open={globalScheduleOpen} activeSlug={null} globalSchedule={state.settings.globalSchedule} presences={state.presences} onClose={() => setGlobalScheduleOpen(false)} />
    </div>
  )
}
