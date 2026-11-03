import { broadcastActiveTab, normalizeActivity } from "@/background/managers/activity-manager";
import { mapPresenceData, postNative } from "@/background/services/native";
import { getSettings } from "@/background/storage/settings.store";
import type { PresenceData } from "@/shared/types";

let testing = false;

export type CreatorTestResult = {
  ok: boolean;
  error?: "PAUSED" | "NO_HOST";
};

export const publishCreatorTest = async (activity: PresenceData): Promise<CreatorTestResult> => {
  const settings = await getSettings();

  if (settings.presencePaused) return {
    ok: false,
    error: "PAUSED"
  };

  const presence = mapPresenceData(normalizeActivity(activity, activity.name ?? "Nowly"));

  if (
    !postNative({
      type: "SET_ACTIVITY",
      presence
    })
  ) return {
    ok: false,
    error: "NO_HOST"
  };

  testing = true;
  return {
    ok: true
  };
};

export const stopCreatorTest = async (): Promise<CreatorTestResult> => {
  if (!testing) return {
    ok: true
  };

  testing = false;
  await broadcastActiveTab();
  return {
    ok: true
  };
};