import { syncPresenceScripts } from "@/background/runtime/presence-scripts"
import { urlMatchesPresence } from "@/shared/url-patterns"
import type { Handler } from "@/background/router/router"
import { getEffectiveApiUrl } from "@/background/services/api-state"
import { getFocusedTabId, getTabPresencesSnapshot, isTabMuted, setFocusedTabId } from "@/background/services/background-context"
import { setTabMuteState } from "@/background/services/context-menu"
import { getActiveDeviceId, syncDeviceState } from "@/background/services/device-sync"
import { addRuntimeLog } from "@/background/runtime-logs"
import { getDeviceToken } from "@/background/storage/device.store"
import { getOnboarding, setOnboarding } from "@/background/storage/onboarding.store"
import { getPresences } from "@/background/storage/presences.store"
import { trackAnalytics } from "@/background/analytics-client"
import { PRESENCE_REPORT_MAX_LENGTH } from "@/shared/constants"
import type { TabState } from "@/shared/types"

export const handleGetOnboarding: Handler<"GET_ONBOARDING"> = () => getOnboarding()

export const handleSetOnboarding: Handler<"SET_ONBOARDING"> = async (partial) => {
  const before = await getOnboarding()
  await setOnboarding(partial)
  const next = await getOnboarding()
  if (partial.onboardingCompleted && !before.onboardingCompleted) {
    trackAnalytics("onboarding_completed", { source: "extension_onboarding" })
    void syncDeviceState()
  }
  return next
}

const hostnameOf = (url: string | undefined): string | null => {
  if (!url) return null
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === "http:" || protocol === "https:" ? hostname.replace(/^www\./, "") : null
  } catch {
    return null
  }
}

const resolveFocusedTab = async (): Promise<chrome.tabs.Tab | undefined> => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (tab?.id != null) {
    setFocusedTabId(tab.id)
    return tab
  }
  const tabId = getFocusedTabId()
  return tabId == null ? undefined : chrome.tabs.get(tabId).catch(() => undefined)
}

const buildTabState = async (): Promise<TabState> => {
  const [tab, presences, activities] = await Promise.all([resolveFocusedTab(), getPresences(), getTabPresencesSnapshot()])
  const tabId = tab?.id ?? null
  const installed = tab?.url
    ? Object.entries(presences).find(([, presence]) => urlMatchesPresence(tab.url!, presence.metadata.url))
    : undefined

  return {
    tabId,
    hostname: hostnameOf(tab?.url),
    muted: tabId != null && (await isTabMuted(tabId)),
    installedSlug: installed?.[0] ?? null,
    activities: activities.filter((entry) => entry.tabId >= 0),
  }
}

export const handleGetTabState: Handler<"GET_TAB_STATE"> = () => buildTabState()

export const handleSetTabMuted: Handler<"SET_TAB_MUTED"> = async ({ tabId, muted }) => {
  await setTabMuteState(tabId, muted)
  return buildTabState()
}

export const handleReportPresence: Handler<"REPORT_PRESENCE"> = async ({ slug, message, locale }) => {
  const text = message.trim().slice(0, PRESENCE_REPORT_MAX_LENGTH)
  if (!text) return { ok: false, error: "EMPTY_MESSAGE" }
  try {
    const response = await fetch(`${getEffectiveApiUrl()}/presences/${encodeURIComponent(slug)}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, locale }),
    })
    addRuntimeLog(response.ok ? "success" : "warn", "api", "POST /presences/:slug/report result", { slug, status: response.status })
    if (response.ok) return { ok: true }
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    return { ok: false, error: body?.error ?? `HTTP_${response.status}` }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "REPORT_FAILED" }
  }
}

const deviceRequest = async (method: "GET" | "DELETE", suffix: string): Promise<Response | { error: string }> => {
  const [deviceId, token] = await Promise.all([getActiveDeviceId(), getDeviceToken()])
  if (!token) return { error: "DEVICE_TOKEN_MISSING" }
  return fetch(`${getEffectiveApiUrl()}/devices/${encodeURIComponent(deviceId)}${suffix}`, {
    method,
    headers: { "X-Device-Token": token },
  })
}

export const handleExportDeviceData: Handler<"EXPORT_DEVICE_DATA"> = async () => {
  try {
    const response = await deviceRequest("GET", "/export")
    if ("error" in response) return { ok: false, error: response.error }
    if (response.status === 404) return { ok: true, data: null }
    if (!response.ok) return { ok: false, error: `HTTP_${response.status}` }
    return { ok: true, data: await response.json() }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "EXPORT_FAILED" }
  }
}

export const handleDeleteDeviceData: Handler<"DELETE_DEVICE_DATA"> = async () => {
  try {
    const response = await deviceRequest("DELETE", "")
    if ("error" in response) return { ok: false, error: response.error }
    addRuntimeLog(response.ok ? "success" : "warn", "api", "DELETE /devices/:deviceId result", { status: response.status })
    return response.ok ? { ok: true } : { ok: false, error: `HTTP_${response.status}` }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "DELETE_FAILED" }
  }
}

export const handleSyncPresenceScripts: Handler<"SYNC_PRESENCE_SCRIPTS"> = async () => {
  await syncPresenceScripts(await getPresences())
  return { ok: true }
}

