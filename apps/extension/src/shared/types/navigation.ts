export type AppView = "activity" | "store" | "custom" | "creator" | "announcements" | "settings" | "logs";
export type PersistedAppView = Exclude<AppView, "logs">;