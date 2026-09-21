import {
  RiDiscordFill,
  RiFocus3Line,
  RiLockLine,
  RiPaletteLine,
  RiSettings3Line,
  RiTerminalLine,
  RiToggleLine,
  RiTranslate2,
} from "@remixicon/react"
import { useEffect, useState } from "react"
import { ScheduleDialog } from "@/features/activity/schedule-dialog"
import { ActivitySelectionSection } from "@/features/settings/sections/activity-selection-section"
import { AppearanceSection } from "@/features/settings/sections/appearance-section"
import { DeveloperSection } from "@/features/settings/sections/developer-section"
import { GeneralSection } from "@/features/settings/sections/general-section"
import { LanguageSection } from "@/features/settings/sections/language-section"
import { NativeConnectionSection } from "@/features/settings/sections/native-connection-section"
import { PrivacySection } from "@/features/settings/sections/privacy-section"
import { ScheduleSection } from "@/features/settings/sections/schedule-section"
import { SettingsSectionCard } from "@/features/settings/settings-section-card"
import { SettingsSectionHeader } from "@/features/settings/settings-section-header"
import { RuntimeLogsView } from "@/features/runtime-logs/runtime-logs-view"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useHostVersion } from "@/hooks/use-host-version"
import { useLocalePreference } from "@/hooks/use-locale-preference"
import { sendMessage } from "@/lib/messages"
import { t } from "@/shared/i18n"
import type { UserScriptsStatus } from "@/shared/types"
import { Skeleton } from "@/ui/skeleton"

const FALLBACK_USER_SCRIPTS_STATUS: UserScriptsStatus = { enabled: false, requiresUserToggle: true }

export type SettingsSectionId =
  | "general"
  | "appearance"
  | "privacy"
  | "activity-selection"
  | "schedule"
  | "presence-language"
  | "native"
  | "developer"
  | "developer-logs"

type SectionEntry = {
  id: SettingsSectionId
  icon: typeof RiPaletteLine
  titleKey: Parameters<typeof t>[0]
  descriptionKey: Parameters<typeof t>[0]
}

const SECTIONS: SectionEntry[] = [
  { id: "general", icon: RiToggleLine, titleKey: "settings-group-general", descriptionKey: "settings-group-general-description" },
  { id: "appearance", icon: RiPaletteLine, titleKey: "settings-group-appearance", descriptionKey: "settings-group-appearance-description" },
  { id: "privacy", icon: RiLockLine, titleKey: "settings-group-privacy", descriptionKey: "settings-group-privacy-description" },
  {
    id: "activity-selection",
    icon: RiFocus3Line,
    titleKey: "settings-group-activity-selection",
    descriptionKey: "settings-group-activity-selection-description",
  },
  { id: "schedule", icon: RiSettings3Line, titleKey: "settings-group-advanced", descriptionKey: "settings-group-advanced-description" },
  {
    id: "presence-language",
    icon: RiTranslate2,
    titleKey: "settings-group-presence-language",
    descriptionKey: "settings-group-presence-language-description",
  },
  { id: "native", icon: RiDiscordFill, titleKey: "settings-group-native", descriptionKey: "settings-group-native-description" },
  { id: "developer", icon: RiTerminalLine, titleKey: "settings-group-developer", descriptionKey: "settings-group-developer-description" },
]

const RuntimeLogsSection = ({ onBack }: { onBack: () => void }): React.JSX.Element => (
  <div className="flex min-h-0 flex-1 flex-col gap-3">
    <SettingsSectionHeader
      title={t("runtime-logs-title")}
      onBack={onBack}
    />
    <RuntimeLogsView />
  </div>
)

type Props = {
  section: SettingsSectionId | null
  onSectionChange: (section: SettingsSectionId | null) => void
}

export const SettingsScreen = ({ section, onSectionChange }: Props): React.JSX.Element => {
  const state = useExtensionState()
  const { localePreference, setLocalePreference } = useLocalePreference()
  const { hostVersionInfo, isCheckingHostVersion, checkHostUpdate } = useHostVersion()
  const [globalScheduleOpen, setGlobalScheduleOpen] = useState(false)
  const [presenceScheduleSlug, setPresenceScheduleSlug] = useState<string | null>(null)
  const [userScripts, setUserScripts] = useState<UserScriptsStatus>(FALLBACK_USER_SCRIPTS_STATUS)

  useEffect(() => {
    void sendMessage("GET_USER_SCRIPTS_STATUS").then((status) => setUserScripts(status ?? FALLBACK_USER_SCRIPTS_STATUS))
  }, [])

  if (state.isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {Array.from({ length: SECTIONS.length }, (_, index) => (
          <Skeleton
            key={index}
            className="m-3 h-14 rounded-lg"
          />
        ))}
      </div>
    )
  }

  const onBack = (): void => onSectionChange(null)

  switch (section) {
    case "general":
      return (
        <GeneralSection
          onBack={onBack}
          settings={state.settings}
          onSettingsChange={state.setSettings}
        />
      )
    case "appearance":
      return (
        <AppearanceSection
          onBack={onBack}
          localePreference={localePreference}
          onLocaleChange={setLocalePreference}
          settings={state.settings}
          onSettingsChange={state.setSettings}
        />
      )
    case "privacy":
      return (
        <PrivacySection
          onBack={onBack}
          analyticsConsent={state.analyticsConsent}
          onAnalyticsConsentChange={state.setAnalyticsConsent}
        />
      )
    case "activity-selection":
      return (
        <ActivitySelectionSection
          onBack={onBack}
          settings={state.settings}
          onSettingsChange={state.setSettings}
          presences={state.presences}
        />
      )
    case "schedule":
      return (
        <>
          <ScheduleSection
            onBack={onBack}
            settings={state.settings}
            onSettingsChange={state.setSettings}
            presences={state.presences}
            onEditGlobalSchedule={() => setGlobalScheduleOpen(true)}
            onEditPresenceSchedule={setPresenceScheduleSlug}
          />
          <ScheduleDialog
            open={globalScheduleOpen}
            activeSlug={null}
            globalSchedule={state.settings.globalSchedule}
            presences={state.presences}
            onClose={() => setGlobalScheduleOpen(false)}
          />
          <ScheduleDialog
            open={presenceScheduleSlug !== null}
            activeSlug={presenceScheduleSlug}
            globalSchedule={state.settings.globalSchedule}
            presences={state.presences}
            onClose={() => setPresenceScheduleSlug(null)}
          />
        </>
      )
    case "presence-language":
      return (
        <LanguageSection
          onBack={onBack}
          settings={state.settings}
          onSettingsChange={state.setSettings}
        />
      )
    case "native":
      return (
        <NativeConnectionSection
          onBack={onBack}
          activity={state.activity}
          presences={state.presences}
          userScripts={userScripts}
          nativeStatus={state.nativeStatus}
          hostVersionInfo={hostVersionInfo}
          isCheckingHostVersion={isCheckingHostVersion}
          onCheckHostUpdate={() => void checkHostUpdate()}
          onConnect={state.connectNative}
          isConnecting={state.isConnectingNative}
        />
      )
    case "developer":
      return (
        <DeveloperSection
          onBack={onBack}
          onOpenLogs={() => onSectionChange("developer-logs")}
          settings={state.settings}
          onSettingsChange={state.setSettings}
          isUnpacked={state.isUnpacked}
          debug={state.debug}
          nativeStatus={state.nativeStatus}
          isCheckingUpdates={state.isCheckingUpdates}
          onCheckUpdates={state.checkUpdates}
          onReplayOnboarding={() => void sendMessage("RESET_ONBOARDING_FOR_DEV")}
        />
      )
    case "developer-logs":
      return <RuntimeLogsSection onBack={() => onSectionChange("developer")} />
    default:
      return (
        <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
          {SECTIONS.map((entry) => (
            <SettingsSectionCard
              key={entry.id}
              icon={entry.icon}
              title={t(entry.titleKey)}
              description={t(entry.descriptionKey)}
              onOpen={() => onSectionChange(entry.id)}
            />
          ))}
        </div>
      )
  }
}
