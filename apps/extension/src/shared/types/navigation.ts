export type AppView = "activity" | "store" | "settings" | "logs"
export type PersistedAppView = Exclude<AppView, "logs">
