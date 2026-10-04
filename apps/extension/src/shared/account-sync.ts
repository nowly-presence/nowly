import { canonicalJson, type SyncDocumentKey } from "@nowly/shared"
import { FEATURE_REVEALS_KEY, isFeatureRevealsState, type FeatureRevealsState } from "@/shared/feature-reveal"
import type { ExtensionSettings, InstalledPresences, PresenceSchedule, SyncPresenceEntry } from "@/shared/types"

export const EXTENSION_SYNC_KEYS = ["settings", "presences", "presenceSettings", "featureReveals"] as const satisfies readonly SyncDocumentKey[]

export type ExtensionSyncKey = (typeof EXTENSION_SYNC_KEYS)[number]

export const SYNCED_SETTINGS_KEYS = [
  "presenceDisplayMode",
  "showPlayer",
  "suggestPresences",
  "hiddenSuggestions",
  "scheduleEnabled",
  "globalSchedule",
  "appearance",
  "seasonalThemes",
  "backgroundAnimation",
  "presenceLanguage",
  "presenceLanguages",
  "activitySelectionMode",
  "activityPriorityOrder",
] as const satisfies readonly (keyof ExtensionSettings)[]

export type SyncedSettings = Pick<ExtensionSettings, (typeof SYNCED_SETTINGS_KEYS)[number]>

export type SyncValues = {
  settings: Partial<SyncedSettings>
  presences: SyncPresenceEntry[]
  presenceSettings: Record<string, Record<string, unknown>>
  featureReveals: FeatureRevealsState
}

export const LOCAL_SYNC_STORAGE_KEYS: Record<ExtensionSyncKey, string> = {
  settings: "settings",
  presences: "presences",
  presenceSettings: "presenceSettings",
  featureReveals: FEATURE_REVEALS_KEY,
}

const SETTING_VALUE_MAX_LENGTH = 512

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export const syncEqual = (left: unknown, right: unknown): boolean => canonicalJson(left ?? null) === canonicalJson(right ?? null)

export const isSyncedPresence = (presence: InstalledPresences[string]): boolean => presence.source !== "local" && presence.source !== "bundle"

export const projectSettings = (settings: ExtensionSettings): Partial<SyncedSettings> => {
  const projected: Record<string, unknown> = {}
  for (const key of SYNCED_SETTINGS_KEYS) {
    if (settings[key] !== undefined) projected[key] = settings[key]
  }
  return projected as Partial<SyncedSettings>
}

const toEntry = (slug: string, enabled: boolean, installedAt: number, schedule: PresenceSchedule | undefined): SyncPresenceEntry =>
  schedule ? { slug, enabled, installedAt, schedule } : { slug, enabled, installedAt }

export const projectPresences = (presences: InstalledPresences, pending: Record<string, SyncPresenceEntry> = {}): SyncPresenceEntry[] => {
  const entries = new Map<string, SyncPresenceEntry>()
  for (const [slug, entry] of Object.entries(pending)) entries.set(slug, entry)
  for (const [slug, presence] of Object.entries(presences)) {
    if (!isSyncedPresence(presence)) continue
    entries.set(slug, toEntry(slug, presence.enabled, Math.round(presence.installedAt), presence.schedule))
  }
  return [...entries.values()].sort((left, right) => left.slug.localeCompare(right.slug))
}

export const isSyncableSettingValue = (value: unknown): boolean =>
  value === null ||
  typeof value === "boolean" ||
  (typeof value === "number" && Number.isFinite(value)) ||
  (typeof value === "string" && value.length <= SETTING_VALUE_MAX_LENGTH)

export const projectPresenceSettings = (settings: Record<string, Record<string, unknown>>): Record<string, Record<string, unknown>> => {
  const projected: Record<string, Record<string, unknown>> = {}
  for (const [slug, values] of Object.entries(settings)) {
    if (!isPlainObject(values)) continue
    const kept = Object.fromEntries(Object.entries(values).filter(([, value]) => isSyncableSettingValue(value)))
    if (Object.keys(kept).length > 0) projected[slug] = kept
  }
  return projected
}

export const projectFeatureReveals = (value: unknown): FeatureRevealsState => (isFeatureRevealsState(value) ? { ...value } : {})

export const mergeThreeWay = (base: unknown, local: unknown, remote: unknown): unknown => {
  if (syncEqual(local, remote)) return local
  if (syncEqual(local, base)) return remote
  if (syncEqual(remote, base)) return local
  if (!isPlainObject(local) || !isPlainObject(remote)) return local
  const baseObject = isPlainObject(base) ? base : {}
  const merged: Record<string, unknown> = {}
  for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const value = mergeThreeWay(baseObject[key], local[key], remote[key])
    if (value !== undefined) merged[key] = value
  }
  return merged
}

const presencesBySlug = (value: unknown): Record<string, unknown> | undefined => {
  if (!Array.isArray(value)) return undefined
  const record: Record<string, unknown> = {}
  for (const entry of value) {
    if (isPlainObject(entry) && typeof entry.slug === "string") record[entry.slug] = entry
  }
  return record
}

export const isSyncPresenceEntry = (value: unknown): value is SyncPresenceEntry =>
  isPlainObject(value) && typeof value.slug === "string" && typeof value.enabled === "boolean" && typeof value.installedAt === "number"

export const mergeSyncValue = (key: ExtensionSyncKey, base: unknown, local: unknown, remote: unknown): unknown => {
  if (key === "featureReveals") {
    const merged: FeatureRevealsState = { ...projectFeatureReveals(remote) }
    for (const [id, seenAt] of Object.entries(projectFeatureReveals(local))) merged[id] = Math.min(seenAt, merged[id] ?? seenAt)
    return merged
  }
  if (key !== "presences") return mergeThreeWay(base, local, remote)
  const merged = mergeThreeWay(presencesBySlug(base), presencesBySlug(local), presencesBySlug(remote))
  if (!isPlainObject(merged)) return []
  return Object.values(merged)
    .filter(isSyncPresenceEntry)
    .sort((left, right) => left.slug.localeCompare(right.slug))
}

export const hasMeaningfulLocalData = (values: Pick<SyncValues, "presences" | "presenceSettings">): boolean =>
  values.presences.length > 0 || Object.keys(values.presenceSettings).length > 0
