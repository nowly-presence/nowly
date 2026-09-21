import type { HostVersionInfo } from "@/hooks/use-host-version"
import type { LocalePreference } from "@/shared/i18n"
import type { CurrentActivity, ExtensionSettings, InstalledPresences, NativeStatus, UserScriptsStatus } from "@/shared/types"
import type { ComponentType, ReactNode } from "react"

export type OnboardingOverlayProps = {
  activity: CurrentActivity | null
  nativeStatus: NativeStatus
  userScripts: UserScriptsStatus
  devReplayOnboarding?: boolean
  onboardingCompleted: boolean
  localePreference: LocalePreference
  onLocaleChange: (locale: LocalePreference) => void
  onConnectNative: () => void
  onComplete: () => void
  onSkipTour: () => void
  presences: InstalledPresences
  settings: ExtensionSettings
  hostVersionInfo?: HostVersionInfo | null
}

export type StepStatus = "loading" | "success" | "error"

export type GuidedStep = {
  actions?: ReactNode
  details?: ReactNode
  icon: ComponentType<{ className?: string }>
  message: string
  status: StepStatus
  title: string
}
