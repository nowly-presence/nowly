import type { PresenceSchedule } from "@/shared/types/presence";

export type PresenceDisplayMode = "category" | "grid";
export type AccentTheme = "default" | "donator" | "fleuri" | "violet" | "vert" | "orange";
export type AppearanceMode = "system" | "light" | "dark";
export type PresenceLocale = "en-US" | "fr-FR" | "es-ES";
export type PresenceLanguageMode = "per-presence" | PresenceLocale;

export type ExtensionSettings = {
  presenceDisplayMode: PresenceDisplayMode;
  separateActivePresence: boolean;
  showPlayer: boolean;
  presencePaused?: boolean;
  developerMode?: boolean;
  customApiBaseUrl?: string;
  scheduleEnabled?: boolean;
  globalSchedule?: PresenceSchedule;
  theme?: AccentTheme;
  appearance?: AppearanceMode;
  canaryTheme?: boolean;
  backgroundAnimation?: boolean;
  presenceLanguage?: PresenceLanguageMode;
  presenceLanguages?: Record<string, PresenceLocale>;
};
