import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SyncValues } from "@/shared/account-sync"

const local = vi.hoisted(() => ({
  values: {
    settings: {},
    presences: [],
    presenceSettings: {},
    featureReveals: {},
  } as SyncValues,
}))

const api = vi.hoisted(() => ({
  fetchSyncDocuments: vi.fn(),
  putSyncDocument: vi.fn(),
  fetchAccountUser: vi.fn(),
  linkDevice: vi.fn(),
  deleteSyncDocuments: vi.fn(),
  revokeExtensionToken: vi.fn(),
}))

const applyLocalSyncValue = vi.hoisted(() =>
  vi.fn(async (key: keyof SyncValues, value: unknown, pending: Record<string, unknown>) => {
    Object.assign(local.values, { [key]: value })
    return pending
  }),
)

vi.mock("@/background/services/account-api", () => api)
vi.mock("@/background/services/account-sync-local", () => ({
  readLocalSyncValues: vi.fn(async () => structuredClone(local.values)),
  applyLocalSyncValue,
  reconcilePendingPresences: vi.fn(async (pending: Record<string, unknown>) => pending),
}))
vi.mock("@/background/runtime-logs", () => ({ addRuntimeLog: vi.fn() }))
vi.mock("@/background/services/device-sync", () => ({ getActiveDeviceId: vi.fn(async () => "device-1"), syncDeviceState: vi.fn() }))
vi.mock("@/background/services/api-state", () => ({ getEffectiveWebUrl: () => "https://nowly.me" }))

const storage: Record<string, unknown> = {}

const installStorage = () => {
  ;(globalThis as { chrome?: unknown }).chrome = {
    storage: {
      local: {
        get: async (key: string) => ({ [key]: storage[key] }),
        set: async (values: Record<string, unknown>) => {
          Object.assign(storage, structuredClone(values))
        },
        remove: async (key: string) => {
          delete storage[key]
        },
      },
    },
  }
}

const ACCOUNT = { token: "nxt_token", user: { id: "u1", name: "Nolo", image: null, discordId: "1" }, scopes: ["sync"], expiresAt: 1, connectedAt: 1 }
const SERVER_TIME = "2026-10-04T10:00:00.000Z"

const signIn = () => {
  storage.account = structuredClone(ACCOUNT)
}

const okList = (documents: Array<{ key: string; value: unknown; version: number }>) => ({
  status: "ok",
  data: { documents: documents.map((document) => ({ ...document, updatedAt: SERVER_TIME })), serverTime: SERVER_TIME },
})

describe("account sync", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const key of Object.keys(storage)) delete storage[key]
    installStorage()
    local.values = { settings: { appearance: "dark" }, presences: [], presenceSettings: {}, featureReveals: {} }
    api.putSyncDocument.mockImplementation(async (_token: string, _key: string, _value: unknown, baseVersion: number) => ({ status: "ok", data: { version: baseVersion + 1 } }))
  })

  it("does nothing without an account", async () => {
    const { runAccountSync } = await import("@/background/services/account-sync")
    await runAccountSync("full")
    expect(api.fetchSyncDocuments).not.toHaveBeenCalled()
  })

  it("uploads every local document on a first sync when the account is empty", async () => {
    signIn()
    api.fetchSyncDocuments.mockResolvedValue(okList([]))
    const { runAccountSync, getAccountSnapshot } = await import("@/background/services/account-sync")

    await runAccountSync("full")

    expect(api.fetchSyncDocuments).toHaveBeenCalledWith("nxt_token", null)
    expect(api.putSyncDocument.mock.calls.map((call) => [call[1], call[3]])).toEqual([
      ["settings", 0],
      ["presences", 0],
      ["presenceSettings", 0],
      ["featureReveals", 0],
    ])
    expect(storage.syncState).toMatchObject({ cursor: SERVER_TIME, documents: { settings: { version: 1, base: { appearance: "dark" } } } })
    const snapshot = await getAccountSnapshot()
    expect(snapshot).toMatchObject({ signedIn: true, pendingChoice: false, error: null })
    expect(snapshot.signedIn && snapshot.lastSyncedAt).toBeGreaterThan(0)
  })

  it("asks which data to keep when both sides have different presences", async () => {
    signIn()
    local.values.presences = [{ slug: "youtube", enabled: true, installedAt: 1 }]
    api.fetchSyncDocuments.mockResolvedValue(okList([{ key: "presences", value: [{ slug: "twitch", enabled: true, installedAt: 2 }], version: 3 }]))
    const { runAccountSync, getAccountSnapshot } = await import("@/background/services/account-sync")

    await runAccountSync("full")

    expect(api.putSyncDocument).not.toHaveBeenCalled()
    expect(applyLocalSyncValue).not.toHaveBeenCalled()
    expect(await getAccountSnapshot()).toMatchObject({ pendingChoice: true })

    await runAccountSync("full")
    expect(api.fetchSyncDocuments).toHaveBeenCalledTimes(1)
  })

  it("adopts the account silently on a device without presences", async () => {
    signIn()
    const remote = [{ slug: "twitch", enabled: true, installedAt: 2 }]
    api.fetchSyncDocuments.mockResolvedValue(okList([{ key: "presences", value: remote, version: 3 }]))
    const { runAccountSync, getAccountSnapshot } = await import("@/background/services/account-sync")

    await runAccountSync("full")

    expect(applyLocalSyncValue).toHaveBeenCalledWith("presences", remote, {})
    expect(api.putSyncDocument.mock.calls.map((call) => call[1])).toEqual(["settings", "presenceSettings", "featureReveals"])
    expect(await getAccountSnapshot()).toMatchObject({ pendingChoice: false })
  })

  it("keeps this device's data when asked, overwriting the account versions", async () => {
    signIn()
    local.values.presences = [{ slug: "youtube", enabled: true, installedAt: 1 }]
    storage.syncState = { documents: {}, cursor: SERVER_TIME, lastSyncedAt: null, error: null, pendingChoice: true, pendingPresences: {} }
    api.fetchSyncDocuments.mockResolvedValue(okList([{ key: "presences", value: [{ slug: "twitch", enabled: true, installedAt: 2 }], version: 3 }]))
    const { resolveSyncChoice, getAccountSnapshot } = await import("@/background/services/account-sync")

    await resolveSyncChoice("device")

    expect(applyLocalSyncValue).not.toHaveBeenCalled()
    expect(api.putSyncDocument).toHaveBeenCalledWith("nxt_token", "presences", local.values.presences, 3)
    expect(await getAccountSnapshot()).toMatchObject({ pendingChoice: false })
  })

  it("merges and retries after a 409", async () => {
    signIn()
    storage.syncState = {
      documents: {
        settings: { version: 1, base: { appearance: "light", showPlayer: true } },
        presences: { version: 1, base: [] },
        presenceSettings: { version: 1, base: {} },
        featureReveals: { version: 1, base: {} },
      },
      cursor: SERVER_TIME,
      lastSyncedAt: 1,
      error: null,
      pendingChoice: false,
      pendingPresences: {},
    }
    local.values.settings = { appearance: "dark", showPlayer: true }
    api.putSyncDocument
      .mockResolvedValueOnce({ status: "conflict", remote: { value: { appearance: "light", showPlayer: false }, version: 2 } })
      .mockResolvedValueOnce({ status: "ok", data: { version: 3 } })
    const { runAccountSync } = await import("@/background/services/account-sync")

    await runAccountSync("push")

    expect(applyLocalSyncValue).toHaveBeenCalledWith("settings", { appearance: "dark", showPlayer: false }, {})
    expect(api.putSyncDocument).toHaveBeenNthCalledWith(2, "nxt_token", "settings", { appearance: "dark", showPlayer: false }, 2)
    expect(api.putSyncDocument).toHaveBeenCalledTimes(2)
    expect(storage.syncState).toMatchObject({ documents: { settings: { version: 3, base: { appearance: "dark", showPlayer: false } } } })
  })

  it("applies remote changes since the last cursor and pushes nothing when they match", async () => {
    signIn()
    storage.syncState = {
      documents: { settings: { version: 1, base: { appearance: "dark" } } },
      cursor: SERVER_TIME,
      lastSyncedAt: 1,
      error: null,
      pendingChoice: false,
      pendingPresences: {},
    }
    local.values = { settings: { appearance: "dark" }, presences: [], presenceSettings: {}, featureReveals: {} }
    api.fetchSyncDocuments.mockResolvedValue(okList([{ key: "settings", value: { appearance: "light" }, version: 2 }]))
    api.putSyncDocument.mockResolvedValue({ status: "ok", data: { version: 1 } })
    const { runAccountSync } = await import("@/background/services/account-sync")

    await runAccountSync("full")

    expect(api.fetchSyncDocuments).toHaveBeenCalledWith("nxt_token", SERVER_TIME)
    expect(applyLocalSyncValue).toHaveBeenCalledWith("settings", { appearance: "light" }, {})
    expect(api.putSyncDocument.mock.calls.map((call) => call[1])).toEqual(["presences", "presenceSettings", "featureReveals"])
  })

  it("signs out locally when the token is rejected, keeping local data untouched", async () => {
    signIn()
    storage.syncState = { documents: {}, cursor: SERVER_TIME, lastSyncedAt: 1, error: null, pendingChoice: false, pendingPresences: {} }
    api.fetchSyncDocuments.mockResolvedValue({ status: "unauthorized" })
    const { runAccountSync, getAccountSnapshot } = await import("@/background/services/account-sync")

    await runAccountSync("full")

    expect(await getAccountSnapshot()).toEqual({ signedIn: false })
    expect(storage.syncState).toBeUndefined()
    expect(applyLocalSyncValue).not.toHaveBeenCalled()
  })

  it("records a network error without signing out", async () => {
    signIn()
    storage.syncState = { documents: {}, cursor: SERVER_TIME, lastSyncedAt: 1, error: null, pendingChoice: false, pendingPresences: {} }
    api.fetchSyncDocuments.mockResolvedValue({ status: "network" })
    const { runAccountSync, getAccountSnapshot } = await import("@/background/services/account-sync")

    await runAccountSync("full")

    expect(await getAccountSnapshot()).toMatchObject({ signedIn: true, error: "NETWORK", lastSyncedAt: 1 })
  })

  it("validates the web session before storing it", async () => {
    const { connectAccount } = await import("@/background/services/account-sync")
    expect(await connectAccount({ token: "abc", user: { id: "u1", name: "Nolo" } })).toEqual({ ok: false, error: "INVALID_SESSION" })
    api.fetchAccountUser.mockResolvedValue({ status: "unauthorized" })
    expect(await connectAccount({ token: "nxt_x", user: { id: "u1", name: "Nolo" }, expiresAt: 1 })).toEqual({ ok: false, error: "UNAUTHORIZED" })
    expect(storage.account).toBeUndefined()
  })
})
