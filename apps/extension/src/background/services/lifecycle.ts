import type { InstalledPresences } from "@/shared/types";
import { handleClearActivity, handleRemovedTab, restoreActivityBadge } from "@/background/managers/activity-manager";
import { trackAnalytics } from "@/background/analytics-client";
import { addRuntimeLog } from "@/background/runtime-logs";
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
      addRuntimeLog("error", "native", "native error", { reason: message.error });
      trackAnalytics("native_heartbeat_failed", { payload: { reason: message.error } });
      void setDebug({
        stage: "native-error",
        message: message.error,
        updatedAt: Date.now(),
      });
      return;
    }

    if (message.type === "CONNECTED") {
      addRuntimeLog("success", "native", "native connected", { nativeVersion: message.version });
      trackAnalytics("native_connected");
    }

    if (message.type === "PONG") {
      addRuntimeLog(message.connected ? "success" : "warn", "native", "native heartbeat", {
        connected: message.connected,
        status: message.status,
        nativeVersion: message.version,
      });
      trackAnalytics(
        message.connected ? "native_heartbeat_ok" : "native_heartbeat_failed",
        message.connected ? undefined : { payload: { reason: message.status } },
      );
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
    if (details.reason === "install") trackAnalytics("extension_install", { source: "system" });
    if (details.reason === "update") trackAnalytics("extension_update", { source: "system" });
    const presences = await bootBackground({ syncScripts: false });
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