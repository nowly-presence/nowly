// Minimal slice of lifecycle wiring, ported early so the side panel opens on
// icon click while the rest of the redesign lands. The full version (native
// connect, activity restore, context menu, device sync...) comes back in
// step 5 of the redesign plan.
type ChromeWithSidePanel = typeof chrome & {
  sidePanel?: { setPanelBehavior(options: { openPanelOnActionClick: boolean }): Promise<void> }
}

type ChromeWithSidebarAction = typeof chrome & {
  sidebarAction?: { toggle(): void }
}

const enableSidePanelAction = (): void => {
  if (import.meta.env.BROWSER === "firefox") {
    chrome.action.onClicked.addListener(() => {
      ;(chrome as ChromeWithSidebarAction).sidebarAction?.toggle()
    })
    return
  }

  const sidePanel = (chrome as ChromeWithSidePanel).sidePanel
  if (!sidePanel) return

  void sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // Some Chromium builds expose sidePanel without action-click behavior.
  })
}

export const registerLifecycleHandlers = (): void => {
  chrome.runtime.onStartup.addListener(enableSidePanelAction)
  chrome.runtime.onInstalled.addListener(enableSidePanelAction)
}

export const initializeBackground = (): void => {
  enableSidePanelAction()
}
