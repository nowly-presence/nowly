import { addRuntimeLog } from "@/background/runtime-logs";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { getActiveDeviceId, syncDeviceState } from "@/background/services/device-sync";

export const sendActiveHeartbeat = async (slugs: string[]): Promise<void> => {
  if (slugs.length === 0) return;

  const deviceId = await getActiveDeviceId();
  addRuntimeLog("info", "api", "POST /presences/active", { count: slugs.length });

  try {
    const response = await fetch(`${getEffectiveApiUrl()}/presences/active`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        presences: slugs,
        deviceId
      })
    });
    addRuntimeLog(response.ok ? "success" : "warn", "api", "POST /presences/active result", {
      status: response.status,
      count: slugs.length
    });
  } catch (error) {
    addRuntimeLog("error", "api", "POST /presences/active failed", { error: error instanceof Error ? error.message : String(error) });
  }

  void syncDeviceState();
};