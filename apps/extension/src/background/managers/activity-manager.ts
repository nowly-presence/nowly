import { trackAnalytics } from "@/background/analytics-client"
import {
  addActiveSlugToState,
  clearActiveSlugsFromState,
  clearTabPresences,
  getActiveSessionStartedAt,
  getActiveSlugsSnapshot,
  getFocusedTabId,
  getTabPresence,
  getTabPresencesSnapshot,
  hasActiveSession,
  isTabMuted,
  notifyBroadcastStateChanged,
  removeActiveSession,
  removeActiveSlugFromState,
  removeTabPresence,
  removeTabPresencesBySlug,
  setActiveSessionStartedAt,
  setTabMuted,
  upsertTabPresence,
} from "@/background/services/background-context"
import { mapPresenceData, postNative } from "@/background/services/native"
import { verifyPresenceRelease } from "@/background/services/release-security"
import { getCurrentActivity, getPresences, setCurrentActivity, setDebug } from "@/background/storage/presences.store"
import { getSettings } from "@/background/storage/settings.store"
import { CDN_BASE_URL } from "@/shared/constants"
import type { ExtensionSettings, PresenceData, StoredPresence } from "@/shared/types"

const clampText = (value: string | undefined, maxLength: number): string | undefined => {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed
}

const normalizeTimestamp = (value: number | undefined): number | undefined => {
  if (!Number.isFinite(value)) return undefined
  if (!value || value <= 0) return undefined
  return Math.floor(value > 10_000_000_000 ? value / 1000 : value)
}

const normalizeImage = (value: string | undefined): string | undefined => {
  if (!value) return undefined
  if (value.startsWith("http://")) return undefined

  const extensionAsset = value.match(/^chrome-extension:\/\/[^/]+\/presences\/([^/]+)\/assets\/(.+)$/i)
  if (extensionAsset?.[1] && extensionAsset[2] && CDN_BASE_URL) {
    return `${CDN_BASE_URL.replace(/\/+$/, "")}/presences/${extensionAsset[1]}/assets/${extensionAsset[2]}`
  }

  if (value.startsWith("https://")) return value
  if (/^[a-z0-9_-]{1,64}$/i.test(value)) return value
  return undefined
}

const setPausedBadge = (): void => {
  chrome.action.setBadgeText({ text: "II" }).catch(() => {})
  chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" }).catch(() => {})
}

const setActivityBadge = (slug?: string): void => {
  if (!slug) {
    chrome.action.setBadgeText({ text: "" }).catch(() => {})
    return
  }
  chrome.action.setBadgeText({ text: "•" }).catch(() => {})
  chrome.action.setBadgeBackgroundColor({ color: "#5865F2" }).catch(() => {})
}

const clearActivityBadge = (): void => {
  chrome.action.setBadgeText({ text: "" }).catch(() => {})
}

export const refreshToolbarBadge = async (): Promise<void> => {
  const settings = await getSettings()
  if (settings.presencePaused) {
    setPausedBadge()
    return
  }
  const activity = await getCurrentActivity()
  if (activity) {
    setActivityBadge(activity.slug)
    return
  }
  clearActivityBadge()
}

export const restoreActivityBadge = (): Promise<void> => refreshToolbarBadge()

export const normalizeActivity = (activity: PresenceData, fallbackName: string): PresenceData => {
  const allowedTypes = new Set([0, 1, 2, 3, 5])
  return {
    name: clampText(activity.name, 128) ?? fallbackName,
    details: clampText(activity.details, 128),
    state: clampText(activity.state, 128),
    startTimestamp: normalizeTimestamp(activity.startTimestamp),
    endTimestamp: normalizeTimestamp(activity.endTimestamp),
    largeImageKey: normalizeImage(activity.largeImageKey),
    largeImageText: clampText(activity.largeImageText, 128),
    smallImageKey: normalizeImage(activity.smallImageKey),
    smallImageText: clampText(activity.smallImageText, 128),
    type: allowedTypes.has(activity.type ?? 0) ? activity.type : 0,
    buttons: activity.buttons
      ?.filter((button) => button.url.startsWith("https://"))
      .slice(0, 2)
      .map((button) => ({
        label: clampText(button.label, 32) ?? "Open",
        url: button.url,
      })),
  }
}

export const shouldHoldDiscord = async (presence: StoredPresence): Promise<boolean> => {
  const settings = await getSettings()
  if (settings.presencePaused) return true
  if (presence.snoozeUntil && presence.snoozeUntil > Date.now()) return true
  if (settings.scheduleEnabled === false) return false

  const schedule = presence.schedule ?? settings.globalSchedule

  if (schedule) {
    const now = new Date()
    const day = now.getDay()
    if (!schedule.days.includes(day)) return true

    if (schedule.start && schedule.end) {
      const minutes = now.getHours() * 60 + now.getMinutes()
      const [startH, startM] = schedule.start.split(":").map(Number)
      const [endH, endM] = schedule.end.split(":").map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      if (minutes < startMinutes || minutes > endMinutes) return true
    }
  }

  return false
}

export const pickBroadcastEntry = (settings: ExtensionSettings) => {
  const entries = getTabPresencesSnapshot()
  if (entries.length === 0) return null

  if (settings.activitySelectionMode === "priority") {
    const order = settings.activityPriorityOrder ?? []
    return [...entries].sort((a, b) => {
      const ai = order.indexOf(a.slug)
      const bi = order.indexOf(b.slug)
      return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi)
    })[0]
  }

  const focusedTabId = getFocusedTabId()
  const focused = focusedTabId != null ? getTabPresence(focusedTabId) : undefined
  return focused ?? entries.reduce((latest, entry) => (entry.updatedAt > latest.updatedAt ? entry : latest))
}

export const broadcastActiveTab = async (): Promise<void> => {
  const settings = await getSettings()
  const entry = pickBroadcastEntry(settings)
  if (!entry) {
    postNative({ type: "CLEAR_ACTIVITY" })
    await setCurrentActivity(null)
  } else {
    postNative({ type: "SET_ACTIVITY", presence: entry.presence })
    await setCurrentActivity({ slug: entry.slug, presence: entry.presence, updatedAt: entry.updatedAt })
  }
  await refreshToolbarBadge()
  notifyBroadcastStateChanged()
}

export const resumeStoredActivityIfAllowed = async (): Promise<void> => {
  const [current, presences, settings] = await Promise.all([getCurrentActivity(), getPresences(), getSettings()])

  if (settings.presencePaused || !current) {
    if (settings.presencePaused) postNative({ type: "CLEAR_ACTIVITY" })
    await refreshToolbarBadge()
    return
  }

  const stored = presences[current.slug]
  if (!stored || (await shouldHoldDiscord(stored))) {
    postNative({ type: "CLEAR_ACTIVITY" })
    await refreshToolbarBadge()
    return
  }

  postNative({ type: "SET_ACTIVITY", presence: current.presence })
  await refreshToolbarBadge()
}

export const getPresenceVersion = async (slug: string): Promise<string | undefined> => {
  const presences = await getPresences()
  return presences[slug]?.release?.version ?? presences[slug]?.metadata?.version ?? undefined
}

export const addActiveSlug = async (slug: string): Promise<void> => {
  addActiveSlugToState(slug)
  if (hasActiveSession(slug)) return
  setActiveSessionStartedAt(slug, Date.now())
  trackAnalytics("presence_session_start", { slug, version: await getPresenceVersion(slug) })
}

export const removeActiveSlug = async (slug: string, reason: string): Promise<void> => {
  removeActiveSlugFromState(slug)
  const startedAt = getActiveSessionStartedAt(slug)
  removeActiveSession(slug)
  if (!startedAt) return
  trackAnalytics("presence_session_end", {
    slug,
    version: await getPresenceVersion(slug),
    payload: { durationMs: Date.now() - startedAt, reason },
  })
}

export const clearActiveSlugs = async (reason: string): Promise<void> => {
  const slugs = getActiveSlugsSnapshot()
  await Promise.all(slugs.map((slug) => removeActiveSlug(slug, reason)))
  clearActiveSlugsFromState()
}

// Content scripts always run in a tab, but the message shape allows tabId to be
// missing (e.g. a stray call) - fall back to a sentinel so the tab map stays keyed by number.
const NO_TAB_ID = -1

export const handleActivityUpdate = async (slug: string, activity: PresenceData, tabId?: number): Promise<{ ok: boolean }> => {
  const resolvedTabId = tabId ?? NO_TAB_ID
  if (await isTabMuted(resolvedTabId)) return { ok: false }

  const presences = await getPresences()
  const stored = presences[slug]
  if (!stored?.release) return { ok: false }
  if (!stored.enabled) {
    const current = await getCurrentActivity()
    if (current?.slug === slug) await handleClearActivity(slug)
    return { ok: false }
  }

  if (await shouldHoldDiscord(stored)) {
    removeTabPresence(resolvedTabId)
    // Keep the Nowly state updated so resume sends the latest activity.
    const appName = activity.appName ?? stored.release.metadata.name
    const normalizedActivity = normalizeActivity(activity, appName)
    const presence = mapPresenceData(normalizedActivity)
    await setCurrentActivity({ slug, presence, updatedAt: Date.now() })
    await broadcastActiveTab()
    return { ok: true }
  }

  const verified = await verifyPresenceRelease(stored.release, slug)
  if (!verified.ok) {
    await setDebug({
      stage: "security",
      message: `[${slug}] ${verified.error ?? "release verification failed"}`,
      updatedAt: Date.now(),
    })
    trackAnalytics("presence_error", {
      slug,
      version: stored.release?.version ?? stored.metadata?.version,
      payload: { stage: "security" },
    })
    return { ok: false }
  }

  const appName = activity.appName ?? stored.release.metadata.name
  const normalizedActivity = normalizeActivity(activity, appName)
  const presence = mapPresenceData(normalizedActivity)

  upsertTabPresence(resolvedTabId, { slug, presence, updatedAt: Date.now() })
  await addActiveSlug(slug)
  await broadcastActiveTab()

  await setDebug({ stage: "activity", message: presence.details ?? "activity received", updatedAt: Date.now() })

  return { ok: true }
}

export const handleClearActivity = async (slug?: string): Promise<{ ok: boolean }> => {
  if (slug) {
    removeTabPresencesBySlug(slug)
    await removeActiveSlug(slug, "clear")
  } else {
    clearTabPresences()
    await clearActiveSlugs("clear")
  }
  await broadcastActiveTab()

  await setDebug({ stage: "clear", message: "activity cleared", updatedAt: Date.now() })

  return { ok: true }
}

export const handleRemovedTab = (tabId: number): void => {
  const hadPresence = Boolean(getTabPresence(tabId))
  removeTabPresence(tabId)
  void setTabMuted(tabId, false)
  void broadcastActiveTab()
  if (hadPresence) void setDebug({ stage: "clear", message: "activity cleared (tab closed)", updatedAt: Date.now() })
}
