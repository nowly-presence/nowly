import type { NativeStatus } from "@/lib/messages";
import type { HostVersionInfo } from "@/hooks/use-host-version";
import type { CurrentActivity, ExtensionSettings, InstalledPresences, UserScriptsStatus } from "@/shared/types";
import type { ComponentType, ReactNode } from "react";

export type OnboardingOverlayProps = {
  activity: CurrentActivity | null;
  nativeStatus: NativeStatus;
  userScripts: UserScriptsStatus;
  devReplayOnboarding?: boolean;
  onboardingCompleted: boolean;
  localePreference: import("@/shared/i18n").LocalePreference;
  onLocaleChange: (locale: import("@/shared/i18n").LocalePreference) => void;
  onConnectNative: () => void;
  onComplete: () => void;
  onSkipTour: () => void;
  presences: InstalledPresences;
  settings: ExtensionSettings;
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void;
  hostVersionInfo?: HostVersionInfo | null;
};

export type StepStatus = "loading" | "success" | "error";

export type GuidedStep = {
  actions?: ReactNode;
  details?: ReactNode;
  icon: ComponentType<{ className?: string }>;
  message: string;
  status: StepStatus;
  title: string;
};
