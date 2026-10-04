import { installPresenceFromApi, togglePresence, uninstallPresence } from "@/background/managers/presence-manager"
import { updateSettings } from "@/background/managers/settings-manager"
import { refreshPresenceLanguage, registerPresenceScript } from "@/background/runtime/presence-scripts"
import { getPresences, getPresenceSettings, setPresences, setPresenceSchedule } from "@/background/storage/presences.store"
import { getSettings } from "@/background/storage/settings.store"
import { STORAGE_KEYS } from "@/background/storage/keys"
import {
  isSyncableSettingValue,
  isSyncedPresence,
  isSyncPresenceEntry,
  projectFeatureReveals,
  projectPresences,
  projectPresenceSettings,
  projectSettings,
  SYNCED_SETTINGS_KEYS,
  syncEqual,
  type ExtensionSyncKey,
  type SyncValues,
} from "@/shared/account-sync"
import { FEATURE_REVEALS_KEY, loadFeatureReveals } from "@/shared/feature-reveal"
import type { ExtensionSettings, SyncPresenceEntry } from "@/shared/types"

const LANGUAGE_SETTINGS: ReadonlyArray<keyof ExtensionSettings> = ["presenceLanguage", "presenceLanguages"]

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value)

export const readLocalSyncValues = async (pendingPresences: Record<string, SyncPresenceEntry>): Promise<SyncValues> => {
  const [settings, presences, presenceSettings, featureReveals] = await Promise.all([
    getSettings(),
    getPresences(),
    getPresenceSettings(),
    loadFeatureReveals(),
  ])
  return {
    settings: projectSettings(settings),
    presences: projectPresences(presences, pendingPresences),
    presenceSettings: projectPresenceSettings(presenceSettings),
    featureReveals: projectFeatureReveals(featureReveals),
  }
}

const applySettings = async (value: unknown): Promise<void> => {
  const target = isObject(value) ? value : {}
  const current = await getSettings()
  const partial: Record<string, unknown> = {}
  for (const key of SYNCED_SETTINGS_KEYS) {
    if (!syncEqual(current[key], target[key])) partial[key] = target[key]
  }
  if (Object.keys(partial).length === 0) return
  await updateSettings(partial as Partial<ExtensionSettings>)
  if (LANGUAGE_SETTINGS.some((key) => key in partial)) void refreshPresenceLanguage()
}

const applyPresenceEntry = async (entry: SyncPresenceEntry): Promise<void> => {
  const presences = await getPresences()
  const local = presences[entry.slug]
  if (!local) return
  if (local.installedAt !== entry.installedAt) {
    presences[entry.slug] = { ...local, installedAt: entry.installedAt }
    await setPresences(presences)
  }
  if (!syncEqual(local.schedule, entry.schedule)) await setPresenceSchedule(entry.slug, entry.schedule)
  if (local.enabled !== entry.enabled) await togglePresence({ slug: entry.slug, enabled: entry.enabled })
}

const applyPresences = async (value: unknown): Promise<Record<string, SyncPresenceEntry>> => {
  const entries = Array.isArray(value) ? value.filter(isSyncPresenceEntry) : []
  const targets = new Map(entries.map((entry) => [entry.slug, entry]))
  const presences = await getPresences()
  const pending: Record<string, SyncPresenceEntry> = {}

  for (const [slug, presence] of Object.entries(presences)) {
    if (isSyncedPresence(presence) && !targets.has(slug)) await uninstallPresence({ slug })
  }

  for (const entry of targets.values()) {
    if (!presences[entry.slug]) {
      const result = await installPresenceFromApi({ slug: entry.slug })
      if (!result.ok) {
        pending[entry.slug] = entry
        continue
      }
    }
    await applyPresenceEntry(entry)
  }
  return pending
}

export const reconcilePendingPresences = async (pending: Record<string, SyncPresenceEntry>): Promise<Record<string, SyncPresenceEntry>> => {
  const presences = await getPresences()
  const remaining: Record<string, SyncPresenceEntry> = {}
  for (const entry of Object.values(pending)) {
    if (presences[entry.slug]) await applyPresenceEntry(entry)
    else remaining[entry.slug] = entry
  }
  return remaining
}

const applyPresenceSettings = async (value: unknown): Promise<void> => {
  const target = isObject(value) ? value : {}
  const current = await getPresenceSettings()
  const next: Record<string, Record<string, unknown>> = {}
  const changed: string[] = []
  for (const slug of new Set([...Object.keys(current), ...Object.keys(target)])) {
    const local = isObject(current[slug]) ? current[slug] : {}
    const remote = isObject(target[slug]) ? target[slug] : {}
    const kept = Object.fromEntries(Object.entries(local).filter(([, entry]) => !isSyncableSettingValue(entry)))
    const merged = { ...kept, ...remote }
    if (Object.keys(merged).length > 0) next[slug] = merged
    if (!syncEqual(local, merged)) changed.push(slug)
  }
  if (changed.length === 0) return
  await chrome.storage.local.set({ [STORAGE_KEYS.presenceSettings]: next })
  const presences = await getPresences()
  for (const slug of changed) {
    const stored = presences[slug]
    if (stored?.enabled && stored.release?.bundle) await registerPresenceScript(slug, stored)
  }
}

const applyFeatureReveals = async (value: unknown): Promise<void> => {
  await chrome.storage.local.set({ [FEATURE_REVEALS_KEY]: projectFeatureReveals(value) })
}

export const applyLocalSyncValue = async (
  key: ExtensionSyncKey,
  value: unknown,
  pendingPresences: Record<string, SyncPresenceEntry>,
): Promise<Record<string, SyncPresenceEntry>> => {
  if (key === "settings") await applySettings(value)
  if (key === "presenceSettings") await applyPresenceSettings(value)
  if (key === "featureReveals") await applyFeatureReveals(value)
  if (key === "presences") return applyPresences(value)
  return pendingPresences
}
