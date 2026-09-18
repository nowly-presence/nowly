import type { ExtensionMessage, ExtensionSettings, PresenceData, PresenceDebug, PresenceSchedule, UserScriptsStatus } from "@/shared/types";
import { handleActivityUpdate, handleClearActivity, resumeStoredActivityIfAllowed } from "@/background/managers/activity-manager";
import { trackAnalytics } from "@/background/analytics-client";
import type { TrackInput } from "@nowly/analytics";
import { clearRuntimeLogs, getRuntimeLogs } from "@/background/runtime-logs";
import { reconnectNative, refreshNativeStatus, restartNative } from "@/background/services/native";
import { getInstallQueue } from "@/background/managers/install-queue";
import { setPresencePaused } from "@/background/managers/presence-pause";
import { checkUpdates, drainInstallQueue, fetchPresenceCatalog, installLocalPresenceZip, installPresence, installPresenceFromApi, togglePresence, uninstallPresence } from "@/background/managers/presence-manager";
import { getPresenceStrings, registerPresenceScript, syncPresenceScripts } from "@/background/runtime/presence-scripts";
import { resetOnboardingForDev, updateSettings } from "@/background/managers/settings-manager";
import { getAnalyticsConsent, setAnalyticsConsent, clearSnooze, getCurrentActivity, getDebug, getPresenceSettings, getPresences, getSettings, setDebug, setPresenceSchedule, setPresenceSettings, snoozePresence } from "@/background/services/storage";
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

export const registerRuntimeMessageRouter = (): void => {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
    if (message.source !== "PRESENCES_POPUP" && message.source !== "PRESENCES_CONTENT") return false;

    switch (message.type) {
      case "GET_PRESENCES":
      case "GET_INSTALLED":
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
        respond(sendResponse, reconnectNative());
        return false;

      case "RESTART_NATIVE":
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

      case "INSTALL_PRESENCE_FROM_API":
        installPresenceFromApi(message.payload)
          .then((result) => respond(sendResponse, result))
          .catch((error) => respond(sendResponse, {
            ok: false,
            error: error instanceof Error ? error.message : "presence install failed",
          }));
        return true;

      case "INSTALL_LOCAL_PRESENCE_ZIP":
        installLocalPresenceZip(message.payload)
          .then((result) => respond(sendResponse, result))
          .catch((error) => respond(sendResponse, {
            ok: false,
            error: error instanceof Error ? error.message : "presence install failed",
          }));
        return true;

      case "FETCH_PRESENCE_CATALOG":
        fetchPresenceCatalog()
          .then((items) => respond(sendResponse, { ok: true, items }))
          .catch((error) => respond(sendResponse, {
            ok: false,
            error: error instanceof Error ? error.message : "catalog request failed",
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
          await resumeStoredActivityIfAllowed();
          respond(sendResponse, updated);
        });
        return true;

      case "SET_PRESENCE_PAUSE": {
        const paused = typeof message.payload === "object" && message.payload !== null
          ? (message.payload as { paused?: unknown }).paused
          : undefined;
        if (typeof paused !== "boolean") {
          respond(sendResponse, { ok: false });
          return false;
        }
        setPresencePaused(paused).then((result) => respond(sendResponse, result));
        return true;
      }

      case "GET_INSTALL_QUEUE":
        getInstallQueue().then((items) => respond(sendResponse, { items }));
        return true;

      case "RETRY_INSTALL_QUEUE":
        drainInstallQueue().then((result) => respond(sendResponse, result));
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

      case "GET_ANALYTICS_CONSENT":
        getAnalyticsConsent().then((granted) => respond(sendResponse, { granted }));
        return true;

      case "SET_ANALYTICS_CONSENT": {
        const granted = (message.payload as { granted?: unknown } | undefined)?.granted === true;
        setAnalyticsConsent(granted).then((next) => {
          respond(sendResponse, { granted: next });
          // Only the acceptance itself is worth recording - a decline must not
          // send anything (consent is denied by the time this resolves, so the
          // client's own gate would silently drop it anyway), and consent is
          // granted by the time this call resolves for the accept case.
          if (next) trackAnalytics("analytics_consent_accepted", { source: "extension_settings" });
        });
        return true;
      }

      case "TRACK_EVENT": {
        const { key, ...input } = message.payload as { key: string } & TrackInput;
        trackAnalytics(key, input);
        respond(sendResponse, { ok: true });
        return false;
      }

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
          getPresences().then(async (presences) => {
            const stored = presences[slug];
            trackAnalytics("settings_presence_changed", {
              slug,
              version: stored?.release?.version ?? stored?.metadata?.version,
              payload: { settingCount: Object.keys(partial).length },
            });
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

      case "GET_RUNTIME_LOGS":
        respond(sendResponse, getRuntimeLogs());
        return false;

      case "CLEAR_RUNTIME_LOGS":
        clearRuntimeLogs();
        respond(sendResponse, { ok: true });
        return false;

      default:
        respond(sendResponse, { ok: false });
        return false;
    }
  });
};
