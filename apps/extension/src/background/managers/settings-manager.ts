import { applyPresencePause } from "@/background/managers/presence-pause";
import type { ExtensionSettings } from "@/shared/types";
import { addRuntimeLog } from "@/background/runtime-logs";
import { setCustomApiUrl } from "@/background/services/background-context";
import { syncDeviceState } from "@/background/services/device-sync";
import { getSettings, setOnboarding, setSettings } from "@/background/services/storage";

export const updateSettings = async (partial: Partial<ExtensionSettings>): Promise<ExtensionSettings> => {
  const previousSettings = await getSettings();
  const settings = await setSettings(partial);
  setCustomApiUrl(settings.customApiBaseUrl);
  void syncDeviceState();
  addRuntimeLog("info", "settings", "settings changed", {
    customApiEnabled: Boolean(settings.customApiBaseUrl),
    scheduleEnabled: settings.scheduleEnabled !== false,
  });

  if (typeof partial.presencePaused === "boolean" && partial.presencePaused !== previousSettings.presencePaused) {
    await applyPresencePause(partial.presencePaused);
  }

  return settings;
};

export const resetOnboardingForDev = async (): Promise<ExtensionSettings> => {
  await setOnboarding({ devReplayOnboarding: true, onboardingCompleted: false });
  const settings = await getSettings();
  await syncDeviceState();
  addRuntimeLog("info", "settings", "developer onboarding reset");
  return settings;
};