import { resumeStoredActivityIfAllowed, refreshToolbarBadge } from "@/background/managers/activity-manager";
import { postNative } from "@/background/services/native";
import { getSettings, setSettings } from "@/background/services/storage";

export const applyPresencePause = async (paused: boolean): Promise<void> => {
  await setSettings({ presencePaused: paused });

  if (paused) {
    postNative({ type: "CLEAR_ACTIVITY" });
    await refreshToolbarBadge();
    return;
  }

  await resumeStoredActivityIfAllowed();
};

export const setPresencePaused = async (paused: boolean): Promise<{ ok: boolean; paused: boolean }> => {
  await applyPresencePause(paused);
  const settings = await getSettings();
  return { ok: true, paused: settings.presencePaused === true };
};

export const togglePresencePaused = async (): Promise<{ ok: boolean; paused: boolean }> => {
  const settings = await getSettings();
  return setPresencePaused(settings.presencePaused !== true);
};
