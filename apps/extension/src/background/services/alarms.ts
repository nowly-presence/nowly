import { INSTALL_QUEUE_ALARM } from "@/background/managers/install-queue";
import { drainInstallQueue } from "@/background/managers/presence-manager";
import { getPresenceVersion } from "@/background/managers/activity-manager";
import { addAnalyticsLog } from "@/background/analytics/analytics-log";
import { flushAnalytics, trackAnalytics } from "@/background/analytics/analytics-tracker";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { getActiveSlugsSnapshot, hasActiveSlugs } from "@/background/services/background-context";
import { getActiveDeviceId, syncDeviceState } from "@/background/services/device-sync";
import { postNative } from "@/background/services/native";

export const registerAlarmHandlers = (): void => {
  chrome.alarms.create("native-heartbeat", { periodInMinutes: 1 });
  chrome.alarms.create("api-heartbeat", { periodInMinutes: 5 });
  chrome.alarms.create("analytics-flush", { periodInMinutes: 2 });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "native-heartbeat") postNative({ type: "PING" });
    if (alarm.name === "api-heartbeat" && hasActiveSlugs()) {
      void (async () => {
        const slugs = getActiveSlugsSnapshot();
        const deviceId = await getActiveDeviceId();
        addAnalyticsLog("info", "api", "POST /presences/active", { count: slugs.length });
        try {
          const response = await fetch(`${getEffectiveApiUrl()}/presences/active`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ presences: slugs, deviceId }),
          });
          addAnalyticsLog(response.ok ? "success" : "warn", "api", "POST /presences/active result", { status: response.status, count: slugs.length });
        } catch (error) {
          addAnalyticsLog("error", "api", "POST /presences/active failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
        void syncDeviceState();
        for (const slug of slugs) {
          void trackAnalytics("presence_active_heartbeat", {
            slug,
            version: await getPresenceVersion(slug),
            payload: { source: "heartbeat" },
          });
        }
      })();
    }
    if (alarm.name === "analytics-flush") void flushAnalytics();
    if (alarm.name === INSTALL_QUEUE_ALARM) void drainInstallQueue();
  });
};