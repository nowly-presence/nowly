import { INSTALL_QUEUE_ALARM } from "@/background/managers/install-queue";
import { drainInstallQueue } from "@/background/managers/presence-manager";
import { trackAnalytics } from "@/background/analytics-client";
import { addRuntimeLog } from "@/background/runtime-logs";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { getActiveSlugsSnapshot, hasActiveSlugs } from "@/background/services/background-context";
import { getActiveDeviceId, syncDeviceState } from "@/background/services/device-sync";
import { postNative } from "@/background/services/native";
import { getPresences } from "@/background/services/storage";

export const registerAlarmHandlers = (): void => {
  chrome.alarms.create("native-heartbeat", { periodInMinutes: 1 });
  chrome.alarms.create("api-heartbeat", { periodInMinutes: 5 });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "native-heartbeat") postNative({ type: "PING" });
    if (alarm.name === "api-heartbeat" && hasActiveSlugs()) {
      void (async () => {
        const slugs = getActiveSlugsSnapshot();
        const deviceId = await getActiveDeviceId();
        addRuntimeLog("info", "api", "POST /presences/active", { count: slugs.length });
        const presences = await getPresences();
        for (const slug of slugs) {
          const stored = presences[slug];
          trackAnalytics("presence_active_heartbeat", {
            slug,
            version: stored?.release?.version ?? stored?.metadata?.version,
            source: "extension_library",
          });
        }
        try {
          const response = await fetch(`${getEffectiveApiUrl()}/presences/active`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ presences: slugs, deviceId }),
          });
          addRuntimeLog(response.ok ? "success" : "warn", "api", "POST /presences/active result", { status: response.status, count: slugs.length });
        } catch (error) {
          addRuntimeLog("error", "api", "POST /presences/active failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
        void syncDeviceState();
      })();
    }
    if (alarm.name === INSTALL_QUEUE_ALARM) void drainInstallQueue();
  });
};