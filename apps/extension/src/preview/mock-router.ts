import type { PayloadOf, ResponseOf, RouterMessageType } from "@/background/router/contracts"
import type { OnboardingState } from "@/background/storage/onboarding.store"
import type {
  AccountSnapshot,
  CurrentActivity,
  ExtensionSettings,
  InstalledPresences,
  NativeStatus,
  RuntimeLogEntry,
  TabActivity,
  TabState,
} from "@/shared/types"
import type { MockStorageArea } from "@/preview/mock-storage"
import { toStoredPresence, type CatalogFixture } from "@/preview/preview-fixtures"
import { previewParams } from "@/preview/preview-params"

export type MockHandlers = { [K in RouterMessageType]?: (payload: PayloadOf<K>) => ResponseOf<K> | Promise<ResponseOf<K>> }

type MockRouterContext = {
  local: MockStorageArea
  session: MockStorageArea
  catalog: CatalogFixture[]
  installedSlugs: string[]
  tabActivities: TabActivity[]
  logs: RuntimeLogEntry[]
  hasLiveActivity: boolean
}

const MUTABLE_TAB_ID = 11
const FALLBACK_TAB_HOST = "open.spotify.com"
const CATALOG_LATENCY_MS = 250
const INSTALL_LATENCY_MS = 600
const REPORT_LATENCY_MS = 500
const SCRIPTS_GRANT_DELAY_MS = 4000
const SYNC_LATENCY_MS = 700
const LAST_SYNC_AGE_MS = 4 * 60_000
const PREVIEW_USER = { id: "preview-user", name: "Gaëtan", image: null, discordId: "1" }

const initialAccount = (): AccountSnapshot => {
  const { account } = previewParams
  if (account === "out") return { signedIn: false }
  return {
    signedIn: true,
    user: PREVIEW_USER,
    lastSyncedAt: account === "choice" ? null : Date.now() - LAST_SYNC_AGE_MS,
    error: account === "error" ? "NETWORK" : null,
    pendingChoice: account === "choice",
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const createMockRouter = ({ local, session, catalog, installedSlugs, tabActivities, logs, hasLiveActivity }: MockRouterContext) => {
  const { scenario, host } = previewParams
  const bySlug = new Map(catalog.map((item) => [item.slug, item]))
  const [firstSlug, secondSlug] = installedSlugs
  const likes = new Map<string, boolean>()
  let muted = false
  let account = initialAccount()
  let userScriptsEnabled = !previewParams.scriptsDenied
  let native: NativeStatus = {
    connected: scenario !== "nohost",
    discordConnected: scenario !== "nohost" && scenario !== "nodiscord",
    status: scenario === "nohost" ? "Specified native messaging host not found." : "connected",
    version: "1.4.2",
  }

  if (previewParams.scriptsDenied) setTimeout(() => (userScriptsEnabled = true), SCRIPTS_GRANT_DELAY_MS)

  const readPresences = () => local.read<InstalledPresences>("presences", {})
  const writePresences = (presences: InstalledPresences) => local.set({ presences })
  const readSettings = () => local.read<ExtensionSettings>("settings", { presenceDisplayMode: "category", showPlayer: true })
  const readOnboarding = () => local.read<OnboardingState>("onboarding", { devReplayOnboarding: false, onboardingCompleted: true, nativeSeenConnectedOnce: true })

  const updatePresence = async (slug: string, update: (presences: InstalledPresences) => void) => {
    const presences = await readPresences()
    update(presences)
    await writePresences(presences)
    return presences[slug] ?? null
  }

  const tabState = (): TabState => {
    const firstUrl = firstSlug ? catalog.find((item) => item.slug === firstSlug)?.url?.[0] : undefined
    return {
      tabId: MUTABLE_TAB_ID,
      hostname: host ?? (firstSlug ? (firstUrl ?? null) : FALLBACK_TAB_HOST),
      muted,
      installedSlug: host ? null : (firstSlug ?? null),
      activities: muted ? tabActivities.filter((entry) => entry.tabId !== MUTABLE_TAB_ID) : tabActivities,
    }
  }

  const handlers: MockHandlers = {
    GET_PRESENCES: readPresences,
    GET_SETTINGS: readSettings,
    SET_SETTINGS: async (partial) => {
      const next = { ...(await readSettings()), ...partial }
      await local.set({ settings: next })
      const current = await local.read<CurrentActivity | null>("currentActivity", null)
      if ("presencePaused" in partial && current) await local.set({ currentActivity: { ...current, updatedAt: Date.now() } })
      return next
    },
    GET_CURRENT_ACTIVITY: () => local.read<CurrentActivity | null>("currentActivity", null),
    GET_NATIVE_STATUS: () => native,
    CONNECT_NATIVE: () => native,
    RESTART_NATIVE: () => (native = { ...native, status: "connected" }),
    GET_USER_SCRIPTS_STATUS: () => ({ enabled: userScriptsEnabled, requiresUserToggle: true }),
    GET_ONBOARDING: readOnboarding,
    SET_ONBOARDING: async (partial) => {
      const next = { ...(await readOnboarding()), ...partial }
      await local.set({ onboarding: next })
      return next
    },
    GET_TAB_STATE: tabState,
    SET_TAB_MUTED: async ({ muted: next }) => {
      muted = next
      await session.set({ mutedTabIds: next ? [MUTABLE_TAB_ID] : [] })
      return tabState()
    },
    GET_PRESENCE_SETTINGS: () => local.read<Record<string, Record<string, unknown>>>("presenceSettings", {}),
    SET_PRESENCE_SETTINGS: async ({ slug, partial }) => {
      const all = await local.read<Record<string, Record<string, unknown>>>("presenceSettings", {})
      all[slug] = { ...(all[slug] ?? {}), ...partial }
      await local.set({ presenceSettings: all })
      return all[slug]
    },
    GET_ANALYTICS_CONSENT: async () => ({ granted: (await local.read<boolean>("analyticsConsent", false)) === true }),
    SET_ANALYTICS_CONSENT: async ({ granted }) => {
      await local.set({ analyticsConsent: granted })
      return { granted }
    },
    CHECK_UPDATES: () => (secondSlug ? { [secondSlug]: "2.0.0" } : {}),
    FETCH_PRESENCE_CATALOG: async () => {
      await delay(CATALOG_LATENCY_MS)
      return catalog.length ? { ok: true, items: catalog } : { ok: false, error: "CATALOG_REQUEST_FAILED" }
    },
    INSTALL_PRESENCE_FROM_API: async ({ slug }) => {
      await delay(INSTALL_LATENCY_MS)
      const item = bySlug.get(slug)
      if (!item) return { ok: false, error: "PRESENCE_NOT_FOUND" }
      await updatePresence(slug, (presences) => (presences[slug] = toStoredPresence(item)))
      return { ok: true }
    },
    UNINSTALL_PRESENCE: async ({ slug }) => {
      await updatePresence(slug, (presences) => delete presences[slug])
      return { ok: true }
    },
    TOGGLE_PRESENCE: async ({ slug, enabled }) => {
      await updatePresence(slug, (presences) => {
        if (presences[slug]) presences[slug].enabled = enabled
      })
      return { ok: true }
    },
    SNOOZE_PRESENCE: ({ slug, duration }) =>
      updatePresence(slug, (presences) => {
        if (presences[slug]) presences[slug] = { ...presences[slug], snoozeUntil: Date.now() + duration }
      }),
    CLEAR_SNOOZE: ({ slug }) =>
      updatePresence(slug, (presences) => {
        if (presences[slug]) delete presences[slug].snoozeUntil
      }),
    SET_PRESENCE_SCHEDULE: ({ slug, schedule }) =>
      updatePresence(slug, (presences) => {
        if (presences[slug]) presences[slug] = { ...presences[slug], schedule }
      }),
    GET_PRESENCE_ENGAGEMENT: ({ slug }) => {
      const item = bySlug.get(slug)
      const liked = likes.get(slug) ?? false
      return { liked, likeCount: (item?.likes ?? 0) + (liked ? 1 : 0), totalInstalls: item?.totalInstalls ?? 0, activeUsers: item?.activeUsers ?? 0 }
    },
    SET_PRESENCE_LIKE: ({ slug, liked }) => {
      likes.set(slug, liked)
      return { ok: true, count: (bySlug.get(slug)?.likes ?? 0) + (liked ? 1 : 0) }
    },
    GET_DIAGNOSTIC: () => ({
      extensionInstalled: true,
      userScriptsActive: userScriptsEnabled,
      hostDetected: native.connected,
      discordConnected: Boolean(native.discordConnected),
      presenceInstalled: installedSlugs.length > 0,
      activityDetected: hasLiveActivity,
    }),
    GET_RUNTIME_LOGS: () => logs,
    CLEAR_RUNTIME_LOGS: () => {
      logs.length = 0
      return { ok: true }
    },
    REPORT_PRESENCE: async () => {
      await delay(REPORT_LATENCY_MS)
      return { ok: true }
    },
    EXPORT_DEVICE_DATA: () => ({ ok: true, data: { deviceId: "preview" } }),
    DELETE_DEVICE_DATA: () => ({ ok: true }),
    SYNC_PRESENCE_SCRIPTS: () => ({ ok: true }),
    TRACK_EVENT: () => ({ ok: true }),
    INSTALL_LOCAL_PRESENCE_ZIP: () => ({ ok: false, error: "PREVIEW" }),
    GET_ACCOUNT: () => account,
    START_ACCOUNT_CONNECT: () => {
      account = { signedIn: true, user: PREVIEW_USER, lastSyncedAt: null, error: null, pendingChoice: true }
      return { ok: true }
    },
    NOWLY_SESSION: () => ({ ok: true }),
    SYNC_ACCOUNT: async () => {
      await delay(SYNC_LATENCY_MS)
      if (account.signedIn && !account.pendingChoice && !account.error) account = { ...account, lastSyncedAt: Date.now() }
      return account
    },
    RESOLVE_SYNC_CHOICE: async () => {
      await delay(SYNC_LATENCY_MS)
      if (account.signedIn) account = { ...account, pendingChoice: false, lastSyncedAt: Date.now(), error: null }
      return account
    },
    SIGN_OUT_ACCOUNT: () => (account = { signedIn: false }),
    STOP_ACCOUNT_SYNC: async () => {
      await delay(SYNC_LATENCY_MS)
      account = { signedIn: false }
      return { ok: true }
    },
  }

  const dispatch = async <K extends RouterMessageType>(type: K, payload: PayloadOf<K>): Promise<ResponseOf<K> | undefined> => {
    const handler = handlers[type] as ((payload: PayloadOf<K>) => ResponseOf<K> | Promise<ResponseOf<K>>) | undefined
    return handler ? structuredClone(await handler(payload)) : undefined
  }

  return { dispatch, grantUserScripts: () => (userScriptsEnabled = true), userScriptsEnabled: () => userScriptsEnabled }
}
