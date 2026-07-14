import type { ExtensionMessage, ExtensionSettings, PresenceData, PresenceDebug, PresenceSchedule, UserScriptsStatus } from "@/shared/types";
import { handleActivityUpdate, handleClearActivity } from "@/background/managers/activity-manager";
import { clearAnalyticsLogs, getAnalyticsLogs } from "@/background/analytics/analytics-log";
import { trackAnalytics, trackExtensionOpen } from "@/background/analytics/analytics-tracker";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { getActiveDeviceId } from "@/background/services/device-sync";
import { postNative, reconnectNative, refreshNativeStatus, restartNative } from "@/background/services/native";
import { checkUpdates, installPresence, togglePresence, uninstallPresence } from "@/background/managers/presence-manager";
import { getPresenceStrings, registerPresenceScript, syncPresenceScripts } from "@/background/runtime/presence-scripts";
import { resetOnboardingForDev, updateSettings } from "@/background/managers/settings-manager";
import { clearSnooze, dismissSupporterThankYou, getCurrentActivity, getDebug, getPresenceSettings, getPresences, getSettings, getSupporterStatus, setDebug, setPresenceSchedule, setPresenceSettings, setSupporterStatus, snoozePresence } from "@/background/services/storage";
import { visiblePresences } from "@/background/runtime/user-scripts";

const respond = <T>(sendResponse: (response?: T) => void, value: T): void => sendResponse(value);

const getUserScriptsStatus = async (): Promise<UserScriptsStatus> => {
  const available = Boolean((chrome as unknown as { userScripts?: unknown }).userScripts);
  return {
    enabled: available,
    requiresUserToggle: true,
    reason: available
      ? undefined
      : "chrome.userScripts unavailable. Enable Developer Mode / Allow User Scripts for this extension.",
  };
};

const respondWithUserScriptsStatus = (sendResponse: (response?: UserScriptsStatus) => void): boolean => {
  if (import.meta.env.BROWSER === "firefox") {
    // userScripts is an optional permission on Firefox - reflect the actual grant state.
    chrome.permissions.contains({ permissions: ["userScripts"] }).then((granted) => {
      respond(sendResponse, {
        enabled: granted,
        requiresUserToggle: !granted,
        reason: granted ? undefined : "userScripts permission not granted",
      });
    });
    return true;
  }

  const available = Boolean((chrome as unknown as { userScripts?: unknown }).userScripts);
  respond(sendResponse, {
    enabled: available,
    requiresUserToggle: true,
    reason: available
      ? undefined
      : "chrome.userScripts unavailable. Enable Developer Mode / Allow User Scripts for this extension.",
  });
  return false;
};

const getFreshSupporterStatus = async () => {
  const [deviceId, cached] = await Promise.all([getActiveDeviceId(), getSupporterStatus()]);

  try {
    const response = await fetch(`${getEffectiveApiUrl()}/ads/status?deviceId=${encodeURIComponent(deviceId)}`, {
      cache: "no-store",
    });
    if (!response.ok) return { ...cached, deviceId };

    const status = await response.json() as { hasAds?: unknown; adFree?: unknown };
    const adFree = status.adFree === true;
    return setSupporterStatus({
      adFree,
      hasAds: adFree ? false : status.hasAds !== false,
      deviceId,
      showThankYou: cached.showThankYou === true,
    });
  } catch {
    return { ...cached, deviceId };
  }
};

export const registerRuntimeMessageRouter = (): void => {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
    if (message.source !== "PRESENCES_POPUP" && message.source !== "PRESENCES_CONTENT") return false;

    switch (message.type) {
      case "GET_PRESENCES":
      case "GET_INSTALLED":
        trackExtensionOpen();
        getPresences().then((presences) => respond(sendResponse, visiblePresences(presences)));
        return true;

      case "GET_NATIVE_STATUS":
        respond(sendResponse, refreshNativeStatus());
        return false;

      case "GET_USER_SCRIPTS_STATUS":
        return respondWithUserScriptsStatus(sendResponse);

      case "GET_DIAGNOSTIC":
        Promise.all([getPresences(), getCurrentActivity(), getUserScriptsStatus()]).then(([presences, activity, userScripts]) => {
          const nativeStatus = refreshNativeStatus();
          const visible = visiblePresences(presences);
          respond(sendResponse, {
            extensionInstalled: true,
            userScriptsActive: userScripts.enabled,
            hostDetected: Boolean(nativeStatus.connected || nativeStatus.discordConnected),
            discordConnected: Boolean(nativeStatus.discordConnected),
            presenceInstalled: Object.keys(visible).length > 0,
            activityDetected: Boolean(activity),
          });
        });
        return true;

      case "CONNECT_NATIVE":
        void trackAnalytics("native_reconnect", { payload: { source: "extension" } });
        respond(sendResponse, reconnectNative());
        return false;

      case "RESTART_NATIVE":
        void trackAnalytics("native_reconnect", { payload: { source: "extension_restart" } });
        respond(sendResponse, restartNative());
        return false;

      case "GET_CURRENT_ACTIVITY":
        getCurrentActivity().then((activity) => respond(sendResponse, activity));
        return true;

      case "GET_DEBUG":
        getDebug().then((debug) => respond(sendResponse, debug));
        return true;

      case "INSTALL_PRESENCE":
      case "UPDATE_PRESENCE":
        installPresence(message.payload)
          .then((result) => respond(sendResponse, result))
          .catch((error) => respond(sendResponse, {
            ok: false,
            error: error instanceof Error ? error.message : "presence install failed",
          }));
        return true;

      case "UNINSTALL_PRESENCE":
        uninstallPresence(message.payload).then((result) => respond(sendResponse, result));
        return true;

      case "TOGGLE_PRESENCE":
        togglePresence(message.payload).then((result) => respond(sendResponse, result));
        return true;

      case "ACTIVITY_UPDATE": {
        const { slug, activity } = message.payload as { slug: string; activity: PresenceData };
        handleActivityUpdate(slug, activity, sender.tab?.id).then((result) => respond(sendResponse, result));
        return true;
      }

      case "CLEAR_ACTIVITY":
        handleClearActivity().then((result) => respond(sendResponse, result));
        return true;

      case "SNOOZE_PRESENCE":
        getPresences().then(async () => {
          const { slug, duration } = message.payload as { slug: string; duration: number };
          const updated = await snoozePresence(slug, duration);
          respond(sendResponse, updated);
        });
        return true;

      case "CLEAR_SNOOZE":
        getPresences().then(async () => {
          const { slug } = message.payload as { slug: string };
          const updated = await clearSnooze(slug);
          // Resend the stored activity if one exists for this slug.
          const current = await getCurrentActivity();
          if (current && current.slug === slug) {
            postNative({ type: "SET_ACTIVITY", presence: current.presence });
          }
          respond(sendResponse, updated);
        });
        return true;

      case "SET_PRESENCE_SCHEDULE":
        getPresences().then(async () => {
          const { slug, schedule } = message.payload as { slug: string; schedule: PresenceSchedule | undefined };
          const updated = await setPresenceSchedule(slug, schedule);
          respond(sendResponse, updated);
        });
        return true;

      case "CHECK_UPDATES":
        checkUpdates().then((updates) => respond(sendResponse, updates));
        return true;

      case "GET_SETTINGS":
        trackExtensionOpen();
        getSettings().then((settings) => respond(sendResponse, settings));
        return true;

      case "SET_SETTINGS":
        updateSettings(message.payload as Partial<ExtensionSettings>).then(async (settings) => {
          respond(sendResponse, settings);
          const partial = message.payload as Partial<ExtensionSettings>;
          if (!("presenceLanguage" in partial) && !("presenceLanguages" in partial)) return;
          const presences = await getPresences();
          const presenceSettings = await getPresenceSettings();
          await syncPresenceScripts(presences);
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!tab?.id) return;
          for (const [slug, stored] of Object.entries(presences)) {
            if (!stored.enabled || !stored.metadata.locales) continue;
            chrome.tabs.sendMessage(tab.id, {
              type: "PRESENCE_SETTINGS_UPDATED",
              slug,
              settings: presenceSettings[slug] ?? {},
              strings: getPresenceStrings(slug, stored.metadata, settings),
            }).catch(() => {});
          }
        });
        return true;

      case "GET_SUPPORTER_STATUS":
        getFreshSupporterStatus().then((status) => respond(sendResponse, status));
        return true;

      case "DISMISS_SUPPORTER_THANK_YOU":
        dismissSupporterThankYou().then((status) => respond(sendResponse, status));
        return true;

      case "RESET_ONBOARDING_FOR_DEV":
        resetOnboardingForDev().then((settings) => respond(sendResponse, settings));
        return true;

      case "GET_PRESENCE_SETTINGS":
        getPresenceSettings().then((settings) => respond(sendResponse, settings));
        return true;

      case "SET_PRESENCE_SETTINGS": {
        const { slug, partial } = message.payload as { slug: string; partial: Record<string, unknown> };
        void setPresenceSettings(slug, partial).then((settings) => {
          respond(sendResponse, settings);
          void trackAnalytics("settings_presence_changed", {
            slug,
            payload: { settingCount: Object.keys(settings).length },
          });
          getPresences().then(async (presences) => {
            const stored = presences[slug];
            if (stored?.enabled && stored.release?.bundle) {
              void registerPresenceScript(slug, stored);
              // Push updated settings to the already-running presence on the active tab.
              const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
              if (tab?.id) {
                chrome.tabs.sendMessage(tab.id, {
                  type: "PRESENCE_SETTINGS_UPDATED",
                  slug,
                  settings,
                }).catch(() => {});
              }
            }
          });
        });
        return true;
      }

      case "DEBUG":
        setDebug(message.payload as PresenceDebug).then(() => respond(sendResponse, { ok: true }));
        return true;

      case "GET_ANALYTICS_LOGS":
        respond(sendResponse, getAnalyticsLogs());
        return false;

      case "CLEAR_ANALYTICS_LOGS":
        clearAnalyticsLogs();
        respond(sendResponse, { ok: true });
        return false;

      default:
        respond(sendResponse, { ok: false });
        return false;
    }
  });
};
