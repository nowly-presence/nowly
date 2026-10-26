export type AppView = "activity" | "store" | "custom" | "announcements" | "settings" | "logs";
export type PersistedAppView = Exclude<AppView, "logs">;