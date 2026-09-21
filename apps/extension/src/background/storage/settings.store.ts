import { STORAGE_KEYS } from "@/background/storage/keys"
import type { ExtensionSettings } from "@/shared/types"

export const DEFAULT_SETTINGS: ExtensionSettings = {
  presenceDisplayMode: "category",
  showPlayer: true,
  scheduleEnabled: false,
  appearance: "system",
  presenceLanguage: "per-presence",
  presenceLanguages: {},
  activitySelectionMode: "focused",
  activityPriorityOrder: [],
}

// One-off cleanup for settings blobs written before `separateActivePresence`,
// `theme` and `canaryTheme` were dropped from the schema (the 6-way accent
// theme system was replaced by a single design-system accent, and
// separateActivePresence was dead). Object spread wouldn't strip these on its
// own, so a stale value would otherwise sit in storage forever.
// ponytail: single hand-written migration - promote to a versioned migration
// table if more than one legacy key needs stripping at once.
const LEGACY_SETTINGS_KEYS = ["separateActivePresence", "theme", "canaryTheme"] as const

const migrateStoredSettings = (stored: Record<string, unknown>): { settings: Partial<ExtensionSettings>; changed: boolean } => {
  let changed = false
  const next = { ...stored }
  for (const key of LEGACY_SETTINGS_KEYS) {
    if (key in next) {
      delete next[key]
      changed = true
    }
  }
  return { settings: next as Partial<ExtensionSettings>, changed }
}

export const getSettings = async (): Promise<ExtensionSettings> => {
  const result = await chrome.storage.local.get(STORAGE_KEYS.settings)
  const stored = (result[STORAGE_KEYS.settings] as Record<string, unknown> | undefined) ?? {}
  const { settings: migrated, changed } = migrateStoredSettings(stored)
  const settings = { ...DEFAULT_SETTINGS, ...migrated }

  if (changed) void chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings })

  return settings
}

export const setSettings = async (partial: Partial<ExtensionSettings>): Promise<ExtensionSettings> => {
  const current = await getSettings()
  const next = { ...current, ...partial } satisfies ExtensionSettings
  for (const key of Object.keys(partial) as Array<keyof ExtensionSettings>) {
    if (partial[key] === undefined) delete (next as Partial<ExtensionSettings>)[key]
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: next })
  return next
}
