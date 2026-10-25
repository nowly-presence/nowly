import { resumeStoredActivityIfAllowed } from "@/background/managers/activity-manager";
import { bulkTogglePresences, bulkUninstallPresences, checkUpdates, drainInstallQueue, fetchPresenceCatalog, fetchPresenceEngagement, installLocalPresenceZip, installPresence, installPresenceFromApi, setPresenceLike, togglePresence, uninstallPresence } from "@/background/managers/presence-manager";
import { getInstallQueue } from "@/background/managers/install-queue";
import { registerPresenceScript } from "@/background/runtime/presence-scripts";
import type { Handler } from "@/background/router/router";
import { getPresenceSettings, getPresences, setPresenceSettings, clearSnooze, snoozePresence, setPresenceSchedule } from "@/background/storage/presences.store";
import { visiblePresences } from "@/background/runtime/user-scripts";
import { trackProduct } from "@/background/telemetry";
import { WEB_BASE_URL } from "@/shared/constants";
import { IS_CANARY } from "@/shared/brand";

const toError = (
  error: unknown,
  fallback: string
): {
  ok: false;
  error: string;
} => ({
  ok: false,
  error: error instanceof Error ? error.message : fallback
});

export const handleGetPresences: Handler<"GET_PRESENCES"> = async () => visiblePresences(await getPresences());

export const handleToggle: Handler<"TOGGLE_PRESENCE"> = (payload) => togglePresence(payload);

export const handleUninstall: Handler<"UNINSTALL_PRESENCE"> = (payload, sender) => uninstallPresence(payload, installSource(sender));

export const handleBulkToggle: Handler<"BULK_TOGGLE_PRESENCE"> = ({ slugs, enabled }) => bulkTogglePresences(slugs, enabled);

export const handleBulkUninstall: Handler<"BULK_UNINSTALL_PRESENCE"> = ({ slugs }) => bulkUninstallPresences(slugs);

const installSource = (sender: chrome.runtime.MessageSender): "web" | "extension" => {
  try {
    const origin = new URL(sender.tab?.url ?? "").origin;
    return origin === new URL(WEB_BASE_URL).origin || (IS_CANARY && origin === "http://localhost:3000") ? "web" : "extension";
  } catch {
    return "extension";
  }
};

export const handleInstall: Handler<"INSTALL_PRESENCE"> = async (payload, sender) => {
  const source = installSource(sender);
  void trackProduct({
    name: "presence_install_requested",
    source,
    data: {}
  });
  return installPresence(payload, source).catch((error) => toError(error, "PRESENCE_INSTALL_FAILED"));
};

export const handleUpdate: Handler<"UPDATE_PRESENCE"> = (payload, sender) =>
  installPresence(payload, installSource(sender)).catch((error) => toError(error, "PRESENCE_INSTALL_FAILED"));

export const handleInstallFromApi: Handler<"INSTALL_PRESENCE_FROM_API"> = async (payload) => {
  if (!(await getPresences())[payload.slug]) void trackProduct({
    name: "presence_install_requested",
    source: "extension",
    data: {}
  });
  return installPresenceFromApi(payload, { source: "extension" }).catch((error) => toError(error, "PRESENCE_INSTALL_FAILED"));
};

export const handleInstallLocalZip: Handler<"INSTALL_LOCAL_PRESENCE_ZIP"> = (payload) =>
  installLocalPresenceZip(payload).catch((error) => toError(error, "PRESENCE_INSTALL_FAILED"));

export const handleFetchCatalog: Handler<"FETCH_PRESENCE_CATALOG"> = () =>
  fetchPresenceCatalog()
    .then((items) => ({
      ok: true as const,
      items
    }))
    .catch((error) => toError(error, "CATALOG_REQUEST_FAILED"));

export const handleGetPresenceEngagement: Handler<"GET_PRESENCE_ENGAGEMENT"> = ({ slug }) => fetchPresenceEngagement(slug);

export const handleSetPresenceLike: Handler<"SET_PRESENCE_LIKE"> = ({ slug, liked }) => setPresenceLike(slug, liked);

export const handleGetInstallQueue: Handler<"GET_INSTALL_QUEUE"> = async () => ({ items: await getInstallQueue() });

export const handleRetryInstallQueue: Handler<"RETRY_INSTALL_QUEUE"> = () => drainInstallQueue();

export const handleCheckUpdates: Handler<"CHECK_UPDATES"> = () => checkUpdates();

export const handleGetPresenceSettings: Handler<"GET_PRESENCE_SETTINGS"> = () => getPresenceSettings();

export const handleSetPresenceSettings: Handler<"SET_PRESENCE_SETTINGS"> = async ({ slug, partial }) => {
  const settings = await setPresenceSettings(slug, partial);

  const presences = await getPresences();

  const stored = presences[slug];

  if (stored?.enabled && stored.release?.bundle) {
    void registerPresenceScript(slug, stored);
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (tab?.id) {
      chrome.tabs
        .sendMessage(tab.id, {
          type: "PRESENCE_SETTINGS_UPDATED",
          slug,
          settings
        })
        .catch(() => {});
    }
  }

  return settings;
};

export const handleSnooze: Handler<"SNOOZE_PRESENCE"> = ({ slug, duration }) => snoozePresence(slug, duration);

export const handleClearSnooze: Handler<"CLEAR_SNOOZE"> = async ({ slug }) => {
  const updated = await clearSnooze(slug);
  await resumeStoredActivityIfAllowed();
  return updated;
};

export const handleSetSchedule: Handler<"SET_PRESENCE_SCHEDULE"> = ({ slug, schedule }) => setPresenceSchedule(slug, schedule);