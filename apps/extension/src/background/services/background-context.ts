import type { PresencePayload } from "@/shared/types"

const MUTED_TABS_SESSION_KEY = "mutedTabIds"
const ACTIVE_SLUGS_SESSION_KEY = "activeSlugs"
const ACTIVE_SESSIONS_SESSION_KEY = "activeSessions"
const TAB_PRESENCES_SESSION_KEY = "tabPresences"

export type TabPresenceEntry = { slug: string; presence: PresencePayload; updatedAt: number }
export type TabPresenceRecord = TabPresenceEntry & { tabId: number }

let customApiUrl: string | undefined
let cachedDeviceId: string | null = null
let focusedTabId: number | null = null

export const getCustomApiUrl = (): string | undefined => customApiUrl

export const setCustomApiUrl = (value: string | undefined): void => {
  customApiUrl = value
}

export const getCachedDeviceId = (): string | null => cachedDeviceId

export const setCachedDeviceId = (value: string): void => {
  cachedDeviceId = value
}

export const getFocusedTabId = (): number | null => focusedTabId

export const setFocusedTabId = (value: number | null): void => {
  focusedTabId = value
}

// Persisted (not an in-memory Map) because the MV3 service worker is routinely killed
// after ~30s idle and respawns on the next event. An in-memory map would reset to empty
// on respawn while a presence tab stays open; a later chrome.tabs.onRemoved for that tab
// would then find no entry to clean up, permanently orphaning its active-slug/heartbeat.
const getTabPresencesMap = async (): Promise<Record<number, TabPresenceEntry>> => {
  const stored = await chrome.storage.session.get(TAB_PRESENCES_SESSION_KEY)
  const map = stored[TAB_PRESENCES_SESSION_KEY]
  return map && typeof map === "object" ? (map as Record<number, TabPresenceEntry>) : {}
}

export const upsertTabPresence = async (tabId: number, entry: TabPresenceEntry): Promise<void> => {
  const map = await getTabPresencesMap()
  map[tabId] = entry
  await chrome.storage.session.set({ [TAB_PRESENCES_SESSION_KEY]: map })
}

export const removeTabPresence = async (tabId: number): Promise<void> => {
  const map = await getTabPresencesMap()
  delete map[tabId]
  await chrome.storage.session.set({ [TAB_PRESENCES_SESSION_KEY]: map })
}

export const getTabPresence = async (tabId: number): Promise<TabPresenceEntry | undefined> => (await getTabPresencesMap())[tabId]

export const getTabPresencesSnapshot = async (): Promise<TabPresenceRecord[]> =>
  Object.entries(await getTabPresencesMap()).map(([tabId, entry]) => ({ tabId: Number(tabId), ...entry }))

export const clearTabPresences = async (): Promise<void> => {
  await chrome.storage.session.set({ [TAB_PRESENCES_SESSION_KEY]: {} })
}

export const removeTabPresencesBySlug = async (slug: string): Promise<void> => {
  const map = await getTabPresencesMap()
  for (const [tabId, entry] of Object.entries(map)) {
    if (entry.slug === slug) delete map[Number(tabId)]
  }
  await chrome.storage.session.set({ [TAB_PRESENCES_SESSION_KEY]: map })
}

const getMutedTabIds = async (): Promise<number[]> => {
  const stored = await chrome.storage.session.get(MUTED_TABS_SESSION_KEY)
  const ids = stored[MUTED_TABS_SESSION_KEY]
  return Array.isArray(ids) ? ids.filter((id): id is number => typeof id === "number") : []
}

export const isTabMuted = async (tabId: number): Promise<boolean> => (await getMutedTabIds()).includes(tabId)

export const setTabMuted = async (tabId: number, muted: boolean): Promise<void> => {
  const ids = await getMutedTabIds()
  const next = muted ? [...new Set([...ids, tabId])] : ids.filter((id) => id !== tabId)
  await chrome.storage.session.set({ [MUTED_TABS_SESSION_KEY]: next })
}

export const getActiveSlugsSnapshot = async (): Promise<string[]> => {
  const stored = await chrome.storage.session.get(ACTIVE_SLUGS_SESSION_KEY)
  const slugs = stored[ACTIVE_SLUGS_SESSION_KEY]
  return Array.isArray(slugs) ? slugs.filter((slug): slug is string => typeof slug === "string") : []
}

export const addActiveSlugToState = async (slug: string): Promise<void> => {
  const slugs = await getActiveSlugsSnapshot()
  if (slugs.includes(slug)) return
  await chrome.storage.session.set({ [ACTIVE_SLUGS_SESSION_KEY]: [...slugs, slug] })
}

export const removeActiveSlugFromState = async (slug: string): Promise<void> => {
  const slugs = await getActiveSlugsSnapshot()
  await chrome.storage.session.set({ [ACTIVE_SLUGS_SESSION_KEY]: slugs.filter((entry) => entry !== slug) })
}

// Removes multiple slugs in a single read-modify-write pass. Calling
// removeActiveSlugFromState concurrently (e.g. Promise.all over a bulk
// action) would race - each call reads the same "before" snapshot and the
// last write wins, silently un-removing whichever slug lost the race.
export const removeActiveSlugsFromState = async (slugsToRemove: string[]): Promise<void> => {
  const slugs = await getActiveSlugsSnapshot()
  const remaining = new Set(slugsToRemove)
  await chrome.storage.session.set({ [ACTIVE_SLUGS_SESSION_KEY]: slugs.filter((entry) => !remaining.has(entry)) })
}

export const clearActiveSlugsFromState = async (): Promise<void> => {
  await chrome.storage.session.set({ [ACTIVE_SLUGS_SESSION_KEY]: [] })
}

export const hasActiveSlugs = async (): Promise<boolean> => (await getActiveSlugsSnapshot()).length > 0

// Persisted like activeSlugs (chrome.storage.session) so a mid-viewing SW
// respawn doesn't treat a still-open tab's continuous session as ended -
// otherwise every eviction fragments one viewing session into many short
// presence_session_start/end analytics pairs.
const getActiveSessions = async (): Promise<Record<string, number>> => {
  const stored = await chrome.storage.session.get(ACTIVE_SESSIONS_SESSION_KEY)
  const sessions = stored[ACTIVE_SESSIONS_SESSION_KEY]
  return sessions && typeof sessions === "object" ? (sessions as Record<string, number>) : {}
}

export const hasActiveSession = async (slug: string): Promise<boolean> => slug in (await getActiveSessions())

export const getActiveSessionStartedAt = async (slug: string): Promise<number | undefined> => (await getActiveSessions())[slug]

export const setActiveSessionStartedAt = async (slug: string, startedAt: number): Promise<void> => {
  const sessions = await getActiveSessions()
  await chrome.storage.session.set({ [ACTIVE_SESSIONS_SESSION_KEY]: { ...sessions, [slug]: startedAt } })
}

export const removeActiveSession = async (slug: string): Promise<void> => {
  const sessions = await getActiveSessions()
  delete sessions[slug]
  await chrome.storage.session.set({ [ACTIVE_SESSIONS_SESSION_KEY]: sessions })
}

// Bulk equivalent - see removeActiveSlugsFromState for why concurrent
// per-slug writes to the same storage key race.
export const removeActiveSessions = async (slugs: string[]): Promise<void> => {
  const sessions = await getActiveSessions()
  for (const slug of slugs) delete sessions[slug]
  await chrome.storage.session.set({ [ACTIVE_SESSIONS_SESSION_KEY]: sessions })
}

// Chrome's contextMenus API has no "about to be shown" event, so a dynamic
// per-tab label/enabled state has to be kept in sync eagerly instead. This is
// the single choke point every tab-presence/focus mutation already goes
// through (see broadcastActiveTab), so listeners here stay accurate for free.
const broadcastListeners = new Set<() => void>()

export const onBroadcastStateChanged = (listener: () => void): void => {
  broadcastListeners.add(listener)
}

export const notifyBroadcastStateChanged = (): void => {
  for (const listener of broadcastListeners) listener()
}
