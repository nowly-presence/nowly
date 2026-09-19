import { resetOnboardingForDev, updateSettings } from "@/background/managers/settings-manager"
import { getPresenceStrings, syncPresenceScripts } from "@/background/runtime/presence-scripts"
import type { Handler } from "@/background/router/router"
import { getPresenceSettings, getPresences } from "@/background/storage/presences.store"
import { getSettings } from "@/background/storage/settings.store"
import type { ExtensionSettings } from "@/shared/types"

export const handleGetSettings: Handler<"GET_SETTINGS"> = () => getSettings()

// Pushes updated per-presence strings to the active tab's already-running
// presence scripts when the language settings change - otherwise they'd only
// pick it up on their next natural registration (page reload).
const pushPresenceLanguageUpdate = async (partial: Partial<ExtensionSettings>): Promise<void> => {
  if (!("presenceLanguage" in partial) && !("presenceLanguages" in partial)) return

  const [presences, presenceSettings, settings] = await Promise.all([getPresences(), getPresenceSettings(), getSettings()])
  await syncPresenceScripts(presences)

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return

  for (const [slug, stored] of Object.entries(presences)) {
    if (!stored.enabled || !stored.metadata.locales) continue
    chrome.tabs
      .sendMessage(tab.id, { type: "PRESENCE_SETTINGS_UPDATED", slug, settings: presenceSettings[slug] ?? {}, strings: getPresenceStrings(slug, stored.metadata, settings) })
      .catch(() => {})
  }
}

export const handleSetSettings: Handler<"SET_SETTINGS"> = async (partial) => {
  const settings = await updateSettings(partial)
  void pushPresenceLanguageUpdate(partial)
  return settings
}

export const handleResetOnboardingForDev: Handler<"RESET_ONBOARDING_FOR_DEV"> = () => resetOnboardingForDev()
