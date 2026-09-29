import { resetOnboardingForDev, updateSettings } from "@/background/managers/settings-manager"
import { refreshPresenceLanguage } from "@/background/runtime/presence-scripts"
import type { Handler } from "@/background/router/router"
import { getSettings } from "@/background/storage/settings.store"

export const handleGetSettings: Handler<"GET_SETTINGS"> = () => getSettings()

export const handleSetSettings: Handler<"SET_SETTINGS"> = async (partial) => {
  const settings = await updateSettings(partial)
  if ("presenceLanguage" in partial || "presenceLanguages" in partial) void refreshPresenceLanguage()
  return settings
}

export const handleResetOnboardingForDev: Handler<"RESET_ONBOARDING_FOR_DEV"> = () => resetOnboardingForDev()
