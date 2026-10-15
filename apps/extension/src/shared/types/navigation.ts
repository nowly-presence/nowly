export type AppView = "activity" | "store" | "custom" | "settings" | "logs"
export type PersistedAppView = Exclude<AppView, "logs">
