import type { RouterRequest } from "@/background/router/contracts"
import packageJson from "../../package.json"
import { createMockEvent } from "@/preview/mock-events"
import { createMockRouter } from "@/preview/mock-router"
import { createMockStorageArea, type StorageChanges } from "@/preview/mock-storage"
import { buildInstalledPresences, buildLiveActivity, buildRuntimeLogs, loadCatalogFixture, pickInstalledSlugs } from "@/preview/preview-fixtures"
import { previewParams } from "@/preview/preview-params"
import type { TabActivity } from "@/shared/types"

const SECOND_TAB_OFFSET_MS = 20_000

export const installMockChrome = async (): Promise<void> => {
  const now = Date.now()
  const storageChanged = createMockEvent<[StorageChanges, string]>()
  const runtimeMessage = createMockEvent<[unknown]>()
  const local = createMockStorageArea("local", storageChanged)
  const session = createMockStorageArea("session", storageChanged)

  const catalog = await loadCatalogFixture(now)
  const installedSlugs = pickInstalledSlugs(catalog, previewParams.scenario)
  const presences = buildInstalledPresences(catalog, installedSlugs, now)
  const [firstSlug, secondSlug] = installedSlugs
  const showsActivity = previewParams.scenario === "live" || previewParams.scenario === "paused"
  const liveActivity = showsActivity ? buildLiveActivity(firstSlug, presences, now) : null

  const tabActivities: TabActivity[] =
    liveActivity && secondSlug && presences[secondSlug]
      ? [
          { tabId: 11, slug: liveActivity.slug, presence: liveActivity.presence, updatedAt: now },
          { tabId: 12, slug: secondSlug, presence: { name: presences[secondSlug].metadata.name, details: "Pull request #482", state: "Reviewing code" }, updatedAt: now - SECOND_TAB_OFFSET_MS },
        ]
      : []

  await local.set({
    presences,
    currentActivity: liveActivity,
    settings: {
      presenceDisplayMode: "category",
      showPlayer: true,
      suggestPresences: true,
      scheduleEnabled: false,
      appearance: previewParams.theme,
      seasonalThemes: true,
      presenceLanguage: "per-presence",
      presenceLanguages: {},
      activitySelectionMode: "focused",
      activityPriorityOrder: [],
      presencePaused: previewParams.scenario === "paused",
      developerMode: previewParams.developer,
    },
    presenceSettings: {},
    onboarding: {
      devReplayOnboarding: false,
      onboardingCompleted: !previewParams.onboarding,
      nativeSeenConnectedOnce: true,
      nativeProfile: { id: "1", username: "gaetan", globalName: "Gaëtan" },
    },
    analyticsConsent: false,
    localePreference: previewParams.lang ?? "browser",
    sidepanelActiveView: previewParams.view,
    reviewPrompt: { firstSeenAt: previewParams.review ? 0 : now },
    featureReveals: previewParams.reveal ? {} : { "account-sync": now },
    ...(previewParams.season ? { seasonOverride: previewParams.season } : {}),
    ...(previewParams.prank ? { halloweenPrank: { replay: true } } : {}),
    ...(previewParams.slug ? { sidepanelPendingNav: { view: previewParams.view, slug: previewParams.slug, at: now } } : {}),
  })

  const router = createMockRouter({
    local,
    session,
    catalog,
    installedSlugs,
    tabActivities,
    logs: buildRuntimeLogs(firstSlug, installedSlugs.length, now),
    hasLiveActivity: Boolean(liveActivity),
  })

  const mock = {
    runtime: {
      id: "preview",
      lastError: undefined,
      getManifest: () => ({ version: packageJson.version }),
      getURL: (path: string) => `/${path}`,
      onMessage: runtimeMessage,
      sendMessage: (message: RouterRequest) => router.dispatch(message.type, message.payload),
    },
    storage: { local, session, onChanged: storageChanged },
    i18n: { getUILanguage: () => previewParams.lang ?? navigator.language, getMessage: () => "" },
    tabs: {
      create: ({ url }: { url: string }) => window.open(url, "_blank"),
      query: async () => [],
      onActivated: createMockEvent<[unknown]>(),
      onUpdated: createMockEvent<[number, unknown]>(),
    },
    windows: { onFocusChanged: createMockEvent<[number]>() },
    permissions: {
      request: async () => {
        router.grantUserScripts()
        return true
      },
      contains: async () => router.userScriptsEnabled(),
    },
  }

  Object.assign(globalThis, { chrome: mock })
}
