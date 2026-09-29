const isMac = (): boolean => /mac/i.test(navigator.platform)

export const keyboardShortcuts = () =>
  isMac() ? { openPanel: "⌘⇧Y", togglePause: "⌘⇧U" } : { openPanel: "Ctrl+Shift+Y", togglePause: "Ctrl+Shift+U" }
