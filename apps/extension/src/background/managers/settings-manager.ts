import { broadcastActiveTab } from "@/background/managers/activity-manager"
import { applyPresencePause } from "@/background/managers/presence-pause"
import { trackAnalytics } from "@/background/analytics-client"
import { addRuntimeLog } from "@/background/runtime-logs"
import { setCustomApiUrl } from "@/background/services/background-context"
import { syncDeviceState } from "@/background/services/device-sync"
import { setOnboarding } from "@/background/storage/onboarding.store"
import { getSettings, setSettings } from "@/background/storage/settings.store"
import type { ExtensionSettings } from "@/shared/types"

export const updateSettings = async (partial: Partial<ExtensionSettings>): Promise<ExtensionSettings> => {
  const previousSettings = await getSettings()
  const settings = await setSettings(partial)
  setCustomApiUrl(settings.customApiBaseUrl)
  void syncDeviceState()
  addRuntimeLog("info", "settings", "settings changed", {
    customApiEnabled: Boolean(settings.customApiBaseUrl),
    scheduleEnabled: settings.scheduleEnabled !== false,
  })

  if ("presenceDisplayMode" in partial || "showPlayer" in partial) {
    trackAnalytics("settings_display_changed", {
      payload: { displayMode: settings.presenceDisplayMode, showPlayer: settings.showPlayer },
    })
  }

  if ("customApiBaseUrl" in partial) {
    trackAnalytics("settings_custom_api_changed", { payload: { enabled: Boolean(settings.customApiBaseUrl) } })
  }

  if (typeof partial.presencePaused === "boolean" && partial.presencePaused !== previousSettings.presencePaused) {
    await applyPresencePause(partial.presencePaused)
  }

  if ("activitySelectionMode" in partial || "activityPriorityOrder" in partial) {
    void broadcastActiveTab()
  }

  return settings
}

export const resetOnboardingForDev = async (): Promise<ExtensionSettings> => {
  await setOnboarding({ devReplayOnboarding: true, onboardingCompleted: false })
  const settings = await getSettings()
  await syncDeviceState()
  addRuntimeLog("info", "settings", "developer onboarding reset")
  return settings
}
