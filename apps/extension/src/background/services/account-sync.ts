import { EXTENSION_TOKEN_PREFIX } from "@nowly/shared"
import { addRuntimeLog } from "@/background/runtime-logs"
import {
  deleteSyncDocuments,
  fetchAccountUser,
  fetchSyncDocuments,
  linkDevice,
  putSyncDocument,
  revokeExtensionToken,
  type ApiResult,
  type RemoteSyncDocument,
} from "@/background/services/account-api"
import { applyLocalSyncValue, readLocalSyncValues, reconcilePendingPresences } from "@/background/services/account-sync-local"
import { getEffectiveWebUrl } from "@/background/services/api-state"
import { getActiveDeviceId, syncDeviceState } from "@/background/services/device-sync"
import { clearAccount, getAccount, parseAccountUser, setAccount } from "@/background/storage/account.store"
import { getDeviceToken } from "@/background/storage/device.store"
import { clearSyncState, EMPTY_SYNC_STATE, getSyncState, setSyncState, type SyncState } from "@/background/storage/sync.store"
import {
  EXTENSION_SYNC_KEYS,
  hasMeaningfulLocalData,
  LOCAL_SYNC_STORAGE_KEYS,
  mergeSyncValue,
  syncEqual,
  type ExtensionSyncKey,
} from "@/shared/account-sync"
import type { AccountSnapshot, StoredAccount, SyncChoice } from "@/shared/types"

export const ACCOUNT_SYNC_ALARM = "account-sync"
export const ACCOUNT_SYNC_PERIOD_MINUTES = 5

const LOCAL_CHANGE_DEBOUNCE_MS = 3000
const MAX_CONFLICT_RETRIES = 3

type SyncMode = "full" | "push"
type Failure = Exclude<ApiResult<unknown>, { status: "ok" }>

const isExtensionSyncKey = (key: string): key is ExtensionSyncKey => (EXTENSION_SYNC_KEYS as readonly string[]).includes(key)

const remoteDocuments = (documents: RemoteSyncDocument[]): Map<ExtensionSyncKey, RemoteSyncDocument> => {
  const map = new Map<ExtensionSyncKey, RemoteSyncDocument>()
  for (const document of documents) {
    if (isExtensionSyncKey(document.key)) map.set(document.key, document)
  }
  return map
}

const signOutLocally = async (): Promise<void> => {
  await clearAccount()
  await clearSyncState()
}

const saveIfStillSignedIn = async (account: StoredAccount, state: SyncState): Promise<void> => {
  const current = await getAccount()
  if (current?.token === account.token) await setSyncState(state)
}

const recordFailure = async (account: StoredAccount, state: SyncState, failure: Failure): Promise<void> => {
  if (failure.status === "unauthorized") {
    addRuntimeLog("warn", "api", "account token rejected, signing out")
    await signOutLocally()
    return
  }
  await saveIfStillSignedIn(account, { ...state, error: failure.status === "network" ? "NETWORK" : "SERVER" })
}

const pushKey = async (account: StoredAccount, state: SyncState, key: ExtensionSyncKey, force: boolean): Promise<Failure | null> => {
  const local = (await readLocalSyncValues(state.pendingPresences))[key]
  const known = state.documents[key]
  if (!force && known && syncEqual(local, known.base)) return null

  let value: unknown = local
  let version = known?.version ?? 0
  let base = known?.base
  for (let attempt = 0; attempt < MAX_CONFLICT_RETRIES; attempt += 1) {
    const result = await putSyncDocument(account.token, key, value, version)
    if (result.status === "ok") {
      state.documents[key] = { version: result.data.version, base: value }
      return null
    }
    if (result.status !== "conflict") return result
    const remote = result.remote
    const merged = mergeSyncValue(key, base, value, remote?.value)
    if (!syncEqual(merged, value)) state.pendingPresences = await applyLocalSyncValue(key, merged, state.pendingPresences)
    base = remote?.value
    version = remote?.version ?? 0
    value = merged
    state.documents[key] = { version, base }
    if (remote && syncEqual(merged, remote.value)) return null
  }
  return { status: "server", code: 409 }
}

const pushAll = async (account: StoredAccount, state: SyncState, force = false): Promise<Failure | null> => {
  let failure: Failure | null = null
  for (const key of EXTENSION_SYNC_KEYS) {
    const result = await pushKey(account, state, key, force)
    if (result?.status === "unauthorized") return result
    failure ??= result
  }
  return failure
}

const adoptRemote = async (state: SyncState, documents: Map<ExtensionSyncKey, RemoteSyncDocument>): Promise<void> => {
  for (const [key, document] of documents) {
    const local = (await readLocalSyncValues(state.pendingPresences))[key]
    const value = key === "featureReveals" ? mergeSyncValue(key, undefined, local, document.value) : document.value
    if (!syncEqual(value, local)) state.pendingPresences = await applyLocalSyncValue(key, value, state.pendingPresences)
    state.documents[key] = { version: document.version, base: document.value }
  }
}

const finish = async (account: StoredAccount, state: SyncState, failure: Failure | null): Promise<void> => {
  if (failure) {
    await recordFailure(account, state, failure)
    return
  }
  await saveIfStillSignedIn(account, { ...state, error: null, lastSyncedAt: Date.now() })
}

const firstSync = async (account: StoredAccount): Promise<void> => {
  const result = await fetchSyncDocuments(account.token, null)
  const state: SyncState = { ...EMPTY_SYNC_STATE, documents: {}, pendingPresences: {} }
  if (result.status !== "ok") return recordFailure(account, state, result)

  state.cursor = result.data.serverTime
  const documents = remoteDocuments(result.data.documents)
  const local = await readLocalSyncValues({})
  const identical = [...documents].every(([key, document]) => syncEqual(local[key], document.value))

  if (documents.size > 0 && !identical && hasMeaningfulLocalData(local)) {
    state.pendingChoice = true
    addRuntimeLog("info", "settings", "account sync waiting for a choice")
    return saveIfStillSignedIn(account, state)
  }

  await adoptRemote(state, documents)
  return finish(account, state, await pushAll(account, state))
}

const syncOnce = async (mode: SyncMode): Promise<void> => {
  const account = await getAccount()
  if (!account) return
  const state = await getSyncState()
  if (state.pendingChoice) return
  if (state.cursor === null) return firstSync(account)

  state.pendingPresences = await reconcilePendingPresences(state.pendingPresences)

  if (mode === "full") {
    const result = await fetchSyncDocuments(account.token, state.cursor)
    if (result.status !== "ok") return recordFailure(account, state, result)
    for (const [key, document] of remoteDocuments(result.data.documents)) {
      const known = state.documents[key]
      if (known && document.version <= known.version) continue
      const local = (await readLocalSyncValues(state.pendingPresences))[key]
      const merged = mergeSyncValue(key, known?.base, local, document.value)
      if (!syncEqual(merged, local)) state.pendingPresences = await applyLocalSyncValue(key, merged, state.pendingPresences)
      state.documents[key] = { version: document.version, base: document.value }
    }
    state.cursor = result.data.serverTime
  }

  return finish(account, state, await pushAll(account, state))
}

let running: Promise<void> | null = null
let queued: SyncMode | null = null

const logSyncError = (error: unknown): void => {
  addRuntimeLog("error", "api", "account sync failed", { error: error instanceof Error ? error.message : String(error) })
}

export const runAccountSync = (mode: SyncMode = "full"): Promise<void> => {
  if (running) {
    queued = queued === "full" || mode === "full" ? "full" : "push"
    return running
  }
  const current = syncOnce(mode)
    .catch(logSyncError)
    .finally(() => {
      running = null
      const next = queued
      queued = null
      if (next) void runAccountSync(next)
    })
  running = current
  return current
}

export const resolveSyncChoice = async (choice: SyncChoice): Promise<void> => {
  await running
  const account = await getAccount()
  if (!account) return
  const result = await fetchSyncDocuments(account.token, null)
  const state: SyncState = { ...EMPTY_SYNC_STATE, documents: {}, pendingPresences: {} }
  if (result.status !== "ok") return recordFailure(account, { ...(await getSyncState()) }, result)

  state.cursor = result.data.serverTime
  const documents = remoteDocuments(result.data.documents)
  if (choice === "account") {
    await adoptRemote(state, documents)
    return finish(account, state, await pushAll(account, state))
  }
  for (const [key, document] of documents) state.documents[key] = { version: document.version, base: undefined }
  return finish(account, state, await pushAll(account, state, true))
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value)

const linkThisDevice = async (token: string): Promise<void> => {
  const deviceId = await getActiveDeviceId()
  let deviceToken = await getDeviceToken()
  if (!deviceToken) {
    await syncDeviceState()
    deviceToken = await getDeviceToken()
  }
  if (!deviceToken) return
  const result = await linkDevice(token, deviceId, deviceToken)
  addRuntimeLog(result.status === "ok" ? "success" : "warn", "api", "POST /devices/:deviceId/link result", { status: result.status })
}

export const connectAccount = async (payload: unknown): Promise<{ ok: boolean; error?: string }> => {
  if (!isObject(payload) || typeof payload.token !== "string" || !payload.token.startsWith(EXTENSION_TOKEN_PREFIX)) {
    return { ok: false, error: "INVALID_SESSION" }
  }
  if (!parseAccountUser(payload.user)) return { ok: false, error: "INVALID_SESSION" }

  const me = await fetchAccountUser(payload.token)
  if (me.status !== "ok") return { ok: false, error: me.status === "unauthorized" ? "UNAUTHORIZED" : "NETWORK" }

  const previous = await getAccount()
  if (previous && previous.user.id !== me.data.id) await clearSyncState()
  if (previous && previous.token !== payload.token) void revokeExtensionToken(previous.token)

  await setAccount({
    token: payload.token,
    user: me.data,
    scopes: ["sync"],
    expiresAt: typeof payload.expiresAt === "number" ? payload.expiresAt : 0,
    connectedAt: Date.now(),
  })
  addRuntimeLog("success", "api", "account connected")
  void linkThisDevice(payload.token).finally(() => runAccountSync("full"))
  return { ok: true }
}

export const signOutAccount = async (): Promise<void> => {
  const account = await getAccount()
  await signOutLocally()
  if (account) void revokeExtensionToken(account.token)
}

export const stopAccountSync = async (): Promise<{ ok: boolean; error?: string }> => {
  const account = await getAccount()
  if (!account) return { ok: true }
  const result = await deleteSyncDocuments(account.token)
  if (result.status !== "ok" && result.status !== "unauthorized") return { ok: false, error: result.status === "network" ? "NETWORK" : "SERVER" }
  await signOutLocally()
  return { ok: true }
}

export const getAccountSnapshot = async (): Promise<AccountSnapshot> => {
  const account = await getAccount()
  if (!account) return { signedIn: false }
  const state = await getSyncState()
  return { signedIn: true, user: account.user, lastSyncedAt: state.lastSyncedAt, error: state.error, pendingChoice: state.pendingChoice }
}

export const openAccountConnect = async (): Promise<void> => {
  const deviceId = await getActiveDeviceId()
  const params = new URLSearchParams({ source: "extension", device: deviceId })
  await chrome.tabs.create({ url: `${getEffectiveWebUrl().replace(/\/$/, "")}/extension/connect?${params.toString()}` })
}

let pushTimer: ReturnType<typeof setTimeout> | null = null

const scheduleLocalPush = (): void => {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    void runAccountSync("push")
  }, LOCAL_CHANGE_DEBOUNCE_MS)
}

const SYNCED_STORAGE_KEYS = new Set(Object.values(LOCAL_SYNC_STORAGE_KEYS))

export const registerAccountSyncListeners = (): void => {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return
    if (Object.keys(changes).some((key) => SYNCED_STORAGE_KEYS.has(key))) scheduleLocalPush()
  })
}
