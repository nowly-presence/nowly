import type { PresencePayload } from "@/shared/types"

const MUTED_TABS_SESSION_KEY = "mutedTabIds"
const ACTIVE_SLUGS_SESSION_KEY = "activeSlugs"

export type TabPresenceEntry = { slug: string; presence: PresencePayload; updatedAt: number }
export type TabPresenceRecord = TabPresenceEntry & { tabId: number }

let customApiUrl: string | undefined
let cachedDeviceId: string | null = null
let focusedTabId: number | null = null
const tabPresences = new Map<number, TabPresenceEntry>()
const activeSessions = new Map<string, number>()

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

export const upsertTabPresence = (tabId: number, entry: TabPresenceEntry): void => {
  tabPresences.set(tabId, entry)
}

export const removeTabPresence = (tabId: number): void => {
  tabPresences.delete(tabId)
}

export const getTabPresence = (tabId: number): TabPresenceEntry | undefined => tabPresences.get(tabId)

export const getTabPresencesSnapshot = (): TabPresenceRecord[] => [...tabPresences.entries()].map(([tabId, entry]) => ({ tabId, ...entry }))

export const clearTabPresences = (): void => {
  tabPresences.clear()
}

export const removeTabPresencesBySlug = (slug: string): void => {
  for (const [tabId, entry] of tabPresences.entries()) {
    if (entry.slug === slug) tabPresences.delete(tabId)
  }
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

export const clearActiveSlugsFromState = async (): Promise<void> => {
  await chrome.storage.session.set({ [ACTIVE_SLUGS_SESSION_KEY]: [] })
}

export const hasActiveSlugs = async (): Promise<boolean> => (await getActiveSlugsSnapshot()).length > 0

export const hasActiveSession = (slug: string): boolean => activeSessions.has(slug)

export const getActiveSessionStartedAt = (slug: string): number | undefined => activeSessions.get(slug)

export const setActiveSessionStartedAt = (slug: string, startedAt: number): void => {
  activeSessions.set(slug, startedAt)
}

export const removeActiveSession = (slug: string): void => {
  activeSessions.delete(slug)
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
