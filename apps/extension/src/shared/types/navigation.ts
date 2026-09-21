// Owned here (not by the bottom-nav UI component) because background code
// (context-menu.ts, sidepanel-view.ts) needs it too - a UI component
// shouldn't be an import target for background/shared modules.
export type AppView = "activity" | "store" | "settings" | "logs"
export type PersistedAppView = Exclude<AppView, "logs">
