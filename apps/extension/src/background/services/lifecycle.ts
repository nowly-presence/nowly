import type { InstalledPresences } from "@/shared/types";
import { handleClearActivity, handleRemovedTab, restoreActivityBadge } from "@/background/managers/activity-manager";
import { addAnalyticsLog } from "@/background/analytics/analytics-log";
import { trackAnalytics } from "@/background/analytics/analytics-tracker";
import { initializeCustomApiUrl } from "@/background/services/api-state";
import { syncDeviceState, syncUninstallUrl } from "@/background/services/device-sync";
import { connectNative, onNativeResponse } from "@/background/services/native";
import { drainInstallQueue, installBundledPresences } from "@/background/managers/presence-manager";
import { registerContextMenu } from "@/background/services/context-menu";
import { syncPresenceScripts } from "@/background/runtime/presence-scripts";
import { getPresences, setDebug } from "@/background/services/storage";
import { WEB_BASE_URL } from "@/shared/constants";

type ChromeWithSidePanel = typeof chrome & {
  sidePanel?: {
    setPanelBehavior(options: { openPanelOnActionClick: boolean }): Promise<void>;
  };
};

type ChromeWithSidebarAction = typeof chrome & {
  sidebarAction?: { toggle(): void };
};

const enableSidePanelAction = (): void => {
  if (import.meta.env.BROWSER === "firefox") {
    chrome.action.onClicked.addListener(() => {
      (chrome as ChromeWithSidebarAction).sidebarAction?.toggle();
    });
    return;
  }

  const sidePanel = (chrome as ChromeWithSidePanel).sidePanel;
  if (!sidePanel) return;

  void sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // Some Chromium builds expose sidePanel without action-click behavior.
  });
};

const registerNativeResponseHandler = (): void => {
  onNativeResponse((message) => {
    if (message.type === "ERROR") {
      addAnalyticsLog("error", "native", "native error", { reason: message.error });
      void setDebug({
        stage: "native-error",
        message: message.error,
        updatedAt: Date.now(),
      });
      void trackAnalytics("native_heartbeat_failed", { payload: { reason: "native-error" } });
      return;
    }

    if (message.type === "CONNECTED") {
      addAnalyticsLog("success", "native", "native connected", { nativeVersion: message.version });
      void trackAnalytics("native_connected", { payload: { nativeVersion: message.version } });
    }

    if (message.type === "PONG") {
      addAnalyticsLog(message.connected ? "success" : "warn", "native", "native heartbeat", {
        connected: message.connected,
        status: message.status,
        nativeVersion: message.version,
      });
      void trackAnalytics(message.connected ? "native_heartbeat_ok" : "native_heartbeat_failed", {
        payload: {
          nativeVersion: message.version,
          reason: message.connected ? undefined : "not-connected",
        },
      });
    }

    if (message.type === "OK") {
      void setDebug({
        stage: "native",
        message: "discord activity accepted",
        updatedAt: Date.now(),
      });
    }
  });
};

const openChangelogOnUpdate = (details: chrome.runtime.InstalledDetails): void => {
  if (details.reason !== "update") return;
  if (!chrome.runtime.getManifest().update_url) return;

  const version = chrome.runtime.getManifest().version;
  const webBaseUrl = WEB_BASE_URL.replace(/\/$/, "");
  void chrome.tabs.create({ url: `${webBaseUrl}/changelog/${version}` });
};

const bootBackground = async (options: { restoreBadge?: boolean; syncScripts?: boolean } = {}): Promise<InstalledPresences> => {
  await handleClearActivity();
  connectNative();
  await initializeCustomApiUrl();
  await syncUninstallUrl();
  await installBundledPresences();
  const presences = await getPresences();
  await syncDeviceState();
  void drainInstallQueue();
  if (options.restoreBadge) await restoreActivityBadge();
  if (options.syncScripts !== false) await syncPresenceScripts(presences);
  return presences;
};

export const registerLifecycleHandlers = (): void => {
  registerNativeResponseHandler();

  chrome.runtime.onStartup.addListener(async () => {
    enableSidePanelAction();
    registerContextMenu();
    await bootBackground({ restoreBadge: true });
  });

  chrome.runtime.onInstalled.addListener(async (details) => {
    enableSidePanelAction();
    registerContextMenu();
    const presences = await bootBackground({ syncScripts: false });
    void trackAnalytics(details.reason === "update" ? "extension_update" : "extension_install", {
      payload: { source: "onInstalled", previousVersion: details.previousVersion },
    });
    openChangelogOnUpdate(details);
    await syncPresenceScripts(presences);
  });

  if (import.meta.env.BROWSER === "firefox") {
    chrome.permissions.onAdded.addListener((permissions) => {
      if (!permissions.permissions?.includes("userScripts")) return;
      void getPresences().then((presences) => syncPresenceScripts(presences));
    });
  }

  chrome.tabs.onRemoved.addListener(handleRemovedTab);
};

export const initializeBackground = (): void => {
  enableSidePanelAction();
  registerContextMenu();
  void bootBackground();
};