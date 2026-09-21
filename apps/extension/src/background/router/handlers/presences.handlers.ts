import { resumeStoredActivityIfAllowed } from "@/background/managers/activity-manager"
import {
  bulkTogglePresences,
  bulkUninstallPresences,
  checkUpdates,
  drainInstallQueue,
  fetchPresenceCatalog,
  fetchPresenceEngagement,
  installLocalPresenceZip,
  installPresence,
  installPresenceFromApi,
  setPresenceLike,
  togglePresence,
  uninstallPresence,
} from "@/background/managers/presence-manager"
import { getInstallQueue } from "@/background/managers/install-queue"
import { registerPresenceScript } from "@/background/runtime/presence-scripts"
import type { Handler } from "@/background/router/router"
import {
  getPresenceSettings,
  getPresences,
  setPresenceSettings,
  clearSnooze,
  snoozePresence,
  setPresenceSchedule,
} from "@/background/storage/presences.store"
import { visiblePresences } from "@/background/runtime/user-scripts"
import { trackAnalytics } from "@/background/analytics-client"

const toError = (error: unknown, fallback: string): { ok: false; error: string } => ({
  ok: false,
  error: error instanceof Error ? error.message : fallback,
})

export const handleGetPresences: Handler<"GET_PRESENCES"> = async () => visiblePresences(await getPresences())

export const handleToggle: Handler<"TOGGLE_PRESENCE"> = (payload) => togglePresence(payload)

export const handleUninstall: Handler<"UNINSTALL_PRESENCE"> = (payload) => uninstallPresence(payload)

export const handleBulkToggle: Handler<"BULK_TOGGLE_PRESENCE"> = ({ slugs, enabled }) => bulkTogglePresences(slugs, enabled)

export const handleBulkUninstall: Handler<"BULK_UNINSTALL_PRESENCE"> = ({ slugs }) => bulkUninstallPresences(slugs)

export const handleInstall: Handler<"INSTALL_PRESENCE"> = (payload) =>
  installPresence(payload).catch((error) => toError(error, "PRESENCE_INSTALL_FAILED"))

export const handleUpdate: Handler<"UPDATE_PRESENCE"> = (payload) =>
  installPresence(payload).catch((error) => toError(error, "PRESENCE_INSTALL_FAILED"))

export const handleInstallFromApi: Handler<"INSTALL_PRESENCE_FROM_API"> = (payload) =>
  installPresenceFromApi(payload).catch((error) => toError(error, "PRESENCE_INSTALL_FAILED"))

export const handleInstallLocalZip: Handler<"INSTALL_LOCAL_PRESENCE_ZIP"> = (payload) =>
  installLocalPresenceZip(payload).catch((error) => toError(error, "PRESENCE_INSTALL_FAILED"))

export const handleFetchCatalog: Handler<"FETCH_PRESENCE_CATALOG"> = () =>
  fetchPresenceCatalog()
    .then((items) => ({ ok: true as const, items }))
    .catch((error) => toError(error, "CATALOG_REQUEST_FAILED"))

export const handleGetPresenceEngagement: Handler<"GET_PRESENCE_ENGAGEMENT"> = ({ slug }) => fetchPresenceEngagement(slug)

export const handleSetPresenceLike: Handler<"SET_PRESENCE_LIKE"> = ({ slug, liked }) => setPresenceLike(slug, liked)

export const handleGetInstallQueue: Handler<"GET_INSTALL_QUEUE"> = async () => ({ items: await getInstallQueue() })

export const handleRetryInstallQueue: Handler<"RETRY_INSTALL_QUEUE"> = () => drainInstallQueue()

export const handleCheckUpdates: Handler<"CHECK_UPDATES"> = () => checkUpdates()

export const handleGetPresenceSettings: Handler<"GET_PRESENCE_SETTINGS"> = () => getPresenceSettings()

export const handleSetPresenceSettings: Handler<"SET_PRESENCE_SETTINGS"> = async ({ slug, partial }) => {
  const settings = await setPresenceSettings(slug, partial)

  const presences = await getPresences()
  const stored = presences[slug]
  trackAnalytics("settings_presence_changed", {
    slug,
    version: stored?.release?.version ?? stored?.metadata?.version,
    payload: { settingCount: Object.keys(partial).length },
  })

  if (stored?.enabled && stored.release?.bundle) {
    void registerPresenceScript(slug, stored)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: "PRESENCE_SETTINGS_UPDATED", slug, settings }).catch(() => {})
    }
  }

  return settings
}

export const handleSnooze: Handler<"SNOOZE_PRESENCE"> = ({ slug, duration }) => snoozePresence(slug, duration)

export const handleClearSnooze: Handler<"CLEAR_SNOOZE"> = async ({ slug }) => {
  const updated = await clearSnooze(slug)
  await resumeStoredActivityIfAllowed()
  return updated
}

export const handleSetSchedule: Handler<"SET_PRESENCE_SCHEDULE"> = ({ slug, schedule }) => setPresenceSchedule(slug, schedule)
