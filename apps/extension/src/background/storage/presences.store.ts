import { STORAGE_KEYS } from "@/background/storage/keys"
import type { CurrentActivity, PresenceDebug, PresenceSchedule, PresenceSettings, InstalledPresences, StoredPresence } from "@/shared/types"

export const getPresences = (): Promise<InstalledPresences> =>
  chrome.storage.local.get(STORAGE_KEYS.presences).then((result) => (result[STORAGE_KEYS.presences] ?? {}) as InstalledPresences)

export const setPresences = (presences: InstalledPresences): Promise<void> => chrome.storage.local.set({ [STORAGE_KEYS.presences]: presences })

export const getCurrentActivity = (): Promise<CurrentActivity | null> =>
  chrome.storage.local.get(STORAGE_KEYS.currentActivity).then((result) => (result[STORAGE_KEYS.currentActivity] ?? null) as CurrentActivity | null)

export const setCurrentActivity = (activity: CurrentActivity | null): Promise<void> =>
  chrome.storage.local.set({ [STORAGE_KEYS.currentActivity]: activity })

export const getDebug = (): Promise<PresenceDebug | null> =>
  chrome.storage.local.get(STORAGE_KEYS.presenceDebug).then((result) => (result[STORAGE_KEYS.presenceDebug] ?? null) as PresenceDebug | null)

export const setDebug = (debug: PresenceDebug): Promise<void> => chrome.storage.local.set({ [STORAGE_KEYS.presenceDebug]: debug })

export const getPresenceSettings = async (): Promise<Record<string, PresenceSettings>> => {
  const result = await chrome.storage.local.get(STORAGE_KEYS.presenceSettings)
  return (result[STORAGE_KEYS.presenceSettings] ?? {}) as Record<string, PresenceSettings>
}

export const setPresenceSettings = async (slug: string, partial: PresenceSettings): Promise<PresenceSettings> => {
  const current = await getPresenceSettings()
  const next = { ...(current[slug] ?? {}), ...partial } satisfies PresenceSettings
  current[slug] = next
  await chrome.storage.local.set({ [STORAGE_KEYS.presenceSettings]: current })
  return next
}

export const snoozePresence = async (slug: string, durationMs: number): Promise<StoredPresence | null> => {
  const presences = await getPresences()
  const presence = presences[slug]
  if (!presence) return null
  presences[slug] = { ...presence, snoozeUntil: Date.now() + durationMs }
  await setPresences(presences)
  return presences[slug]
}

export const clearSnooze = async (slug: string): Promise<StoredPresence | null> => {
  const presences = await getPresences()
  const presence = presences[slug]
  if (!presence) return null
  const { snoozeUntil: _, ...rest } = presence
  presences[slug] = rest
  await setPresences(presences)
  return presences[slug]
}

export const setPresenceSchedule = async (slug: string, schedule: PresenceSchedule | undefined): Promise<StoredPresence | null> => {
  const presences = await getPresences()
  const presence = presences[slug]
  if (!presence) return null
  presences[slug] = { ...presence, schedule }
  await setPresences(presences)
  return presences[slug]
}
