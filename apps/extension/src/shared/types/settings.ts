import type { LongLocale } from "@/shared/locales";
import type { PresenceSchedule } from "@/shared/types/presence";

export type PresenceDisplayMode = "category" | "grid";
export type AppearanceMode = "system" | "light" | "dark";
export type TextSize = "normal" | "medium" | "large";
export type PresenceLocale = LongLocale;
export type PresenceLanguageMode = "per-presence" | PresenceLocale;
export type ActivitySelectionMode = "focused" | "priority";

export type ExtensionSettings = {
  presenceDisplayMode: PresenceDisplayMode;
  showPlayer: boolean;
  suggestPresences?: boolean;
  showTrending?: boolean;
  hiddenSuggestions?: string[];
  presencePaused?: boolean;
  developerMode?: boolean;
  canaryShowStableBrand?: boolean;
  customApiBaseUrl?: string;
  scheduleEnabled?: boolean;
  globalSchedule?: PresenceSchedule;
  appearance?: AppearanceMode;
  textSize?: TextSize;
  seasonalThemes?: boolean;
  backgroundAnimation?: boolean;
  presenceLanguage?: PresenceLanguageMode;
  presenceLanguages?: Record<string, PresenceLocale>;
  activitySelectionMode?: ActivitySelectionMode;
  activityPriorityOrder?: string[];
  dockLayout?: string[][];
  hiddenDockTabs?: string[];
  preserveSiteTimer?: boolean;
  showCustomActivitiesInActivity?: boolean;
};