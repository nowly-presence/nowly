import { STORAGE_KEYS } from "@/background/storage/keys"
import { EXTENSION_SYNC_KEYS, isSyncPresenceEntry, type ExtensionSyncKey } from "@/shared/account-sync"
import type { SyncErrorCode, SyncPresenceEntry } from "@/shared/types"

export type SyncDocumentState = { version: number; base: unknown }

export type SyncState = {
  documents: Partial<Record<ExtensionSyncKey, SyncDocumentState>>
  cursor: string | null
  lastSyncedAt: number | null
  error: SyncErrorCode | null
  pendingChoice: boolean
  pendingPresences: Record<string, SyncPresenceEntry>
}

export const EMPTY_SYNC_STATE: SyncState = {
  documents: {},
  cursor: null,
  lastSyncedAt: null,
  error: null,
  pendingChoice: false,
  pendingPresences: {},
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value)

const parseDocuments = (value: unknown): SyncState["documents"] => {
  if (!isObject(value)) return {}
  const documents: SyncState["documents"] = {}
  for (const key of EXTENSION_SYNC_KEYS) {
    const entry = value[key]
    if (isObject(entry) && typeof entry.version === "number") documents[key] = { version: entry.version, base: entry.base }
  }
  return documents
}

const parsePendingPresences = (value: unknown): Record<string, SyncPresenceEntry> =>
  isObject(value) ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, SyncPresenceEntry] => isSyncPresenceEntry(entry[1]))) : {}

export const getSyncState = async (): Promise<SyncState> => {
  const result = await chrome.storage.local.get(STORAGE_KEYS.syncState)
  const value = result[STORAGE_KEYS.syncState]
  if (!isObject(value)) return { ...EMPTY_SYNC_STATE }
  return {
    documents: parseDocuments(value.documents),
    cursor: typeof value.cursor === "string" ? value.cursor : null,
    lastSyncedAt: typeof value.lastSyncedAt === "number" ? value.lastSyncedAt : null,
    error: value.error === "NETWORK" || value.error === "SERVER" ? value.error : null,
    pendingChoice: value.pendingChoice === true,
    pendingPresences: parsePendingPresences(value.pendingPresences),
  }
}

export const setSyncState = (state: SyncState): Promise<void> => chrome.storage.local.set({ [STORAGE_KEYS.syncState]: state })

export const updateSyncState = async (update: (state: SyncState) => SyncState): Promise<SyncState> => {
  const next = update(await getSyncState())
  await setSyncState(next)
  return next
}

export const clearSyncState = (): Promise<void> => chrome.storage.local.remove(STORAGE_KEYS.syncState)
