import { isMediaPlayback, type TabPresenceEntry } from "@/background/services/tab-presence";
import { createSerialQueue } from "@/background/storage/serial-queue";

const MUTED_TABS_SESSION_KEY = "mutedTabIds";
const ACTIVE_SLUGS_SESSION_KEY = "activeSlugs";
const ACTIVE_SESSIONS_SESSION_KEY = "activeSessions";
const TAB_PRESENCES_SESSION_KEY = "tabPresences";

const queueTabPresences = createSerialQueue();
const queueMutedTabs = createSerialQueue();
const queueActiveSlugs = createSerialQueue();
const queueActiveSessions = createSerialQueue();

export type TabPresenceRecord = TabPresenceEntry & {
  tabId: number;
};

let customApiUrl: string | undefined;
let cachedDeviceId: string | null = null;
let focusedTabId: number | null = null;

export const getCustomApiUrl = (): string | undefined => customApiUrl;

export const setCustomApiUrl = (value: string | undefined): void => {
  customApiUrl = value;
};

export const getCachedDeviceId = (): string | null => cachedDeviceId;

export const setCachedDeviceId = (value: string): void => {
  cachedDeviceId = value;
};

export const getFocusedTabId = (): number | null => focusedTabId;

export const setFocusedTabId = (value: number | null): void => {
  focusedTabId = value;
};

const getTabPresencesMap = async (): Promise<Record<number, TabPresenceEntry>> => {
  const stored = await chrome.storage.session.get(TAB_PRESENCES_SESSION_KEY);

  const map = stored[TAB_PRESENCES_SESSION_KEY];
  return map && typeof map === "object" ? (map as Record<number, TabPresenceEntry>) : {};
};

export const upsertTabPresence = (tabId: number, entry: TabPresenceEntry): Promise<void> =>
  queueTabPresences(async () => {
    const map = await getTabPresencesMap();
    map[tabId] = {
      ...entry,
      mediaPlayback: isMediaPlayback(entry, map[tabId])
    };
    await chrome.storage.session.set({ [TAB_PRESENCES_SESSION_KEY]: map });
  });

export const removeTabPresence = (tabId: number): Promise<void> =>
  queueTabPresences(async () => {
    const map = await getTabPresencesMap();
    delete map[tabId];
    await chrome.storage.session.set({ [TAB_PRESENCES_SESSION_KEY]: map });
  });

export const getTabPresence = async (tabId: number): Promise<TabPresenceEntry | undefined> => (await getTabPresencesMap())[tabId];

export const getTabPresencesSnapshot = async (): Promise<TabPresenceRecord[]> =>
  Object.entries(await getTabPresencesMap()).map(([tabId, entry]) => ({
    tabId: Number(tabId),
    ...entry
  }));

export const clearTabPresences = (): Promise<void> =>
  queueTabPresences(() =>
    chrome.storage.session.set({
      [TAB_PRESENCES_SESSION_KEY]: {}
    })
  );

export const removeTabPresencesBySlug = (slug: string): Promise<void> =>
  queueTabPresences(async () => {
    const map = await getTabPresencesMap();

    for (const [tabId, entry] of Object.entries(map)) {
      if (entry.slug === slug) delete map[Number(tabId)];
    }

    await chrome.storage.session.set({ [TAB_PRESENCES_SESSION_KEY]: map });
  });

const getMutedTabIds = async (): Promise<number[]> => {
  const stored = await chrome.storage.session.get(MUTED_TABS_SESSION_KEY);

  const ids = stored[MUTED_TABS_SESSION_KEY];
  return Array.isArray(ids) ? ids.filter((id): id is number => typeof id === "number") : [];
};

export const isTabMuted = async (tabId: number): Promise<boolean> => (await getMutedTabIds()).includes(tabId);

export const setTabMuted = (tabId: number, muted: boolean): Promise<void> =>
  queueMutedTabs(async () => {
    const ids = await getMutedTabIds();

    const next = muted ? [...new Set([...ids, tabId])] : ids.filter((id) => id !== tabId);
    await chrome.storage.session.set({ [MUTED_TABS_SESSION_KEY]: next });
  });

export const getActiveSlugsSnapshot = async (): Promise<string[]> => {
  const stored = await chrome.storage.session.get(ACTIVE_SLUGS_SESSION_KEY);

  const slugs = stored[ACTIVE_SLUGS_SESSION_KEY];
  return Array.isArray(slugs) ? slugs.filter((slug): slug is string => typeof slug === "string") : [];
};

export const addActiveSlugToState = (slug: string): Promise<void> =>
  queueActiveSlugs(async () => {
    const slugs = await getActiveSlugsSnapshot();

    if (slugs.includes(slug)) return;

    await chrome.storage.session.set({
      [ACTIVE_SLUGS_SESSION_KEY]: [...slugs, slug]
    });
  });

export const removeActiveSlugFromState = (slug: string): Promise<void> => removeActiveSlugsFromState([slug]);

export const removeActiveSlugsFromState = (slugsToRemove: string[]): Promise<void> =>
  queueActiveSlugs(async () => {
    const slugs = await getActiveSlugsSnapshot();

    const remaining = new Set(slugsToRemove);
    await chrome.storage.session.set({ [ACTIVE_SLUGS_SESSION_KEY]: slugs.filter((entry) => !remaining.has(entry)) });
  });

export const clearActiveSlugsFromState = (): Promise<void> =>
  queueActiveSlugs(() =>
    chrome.storage.session.set({
      [ACTIVE_SLUGS_SESSION_KEY]: []
    })
  );

export const hasActiveSlugs = async (): Promise<boolean> => (await getActiveSlugsSnapshot()).length > 0;

const getActiveSessions = async (): Promise<Record<string, number>> => {
  const stored = await chrome.storage.session.get(ACTIVE_SESSIONS_SESSION_KEY);

  const sessions = stored[ACTIVE_SESSIONS_SESSION_KEY];
  return sessions && typeof sessions === "object" ? (sessions as Record<string, number>) : {};
};

export const hasActiveSession = async (slug: string): Promise<boolean> => slug in (await getActiveSessions());

export const getActiveSessionStartedAt = async (slug: string): Promise<number | undefined> => (await getActiveSessions())[slug];

export const setActiveSessionStartedAt = (slug: string, startedAt: number): Promise<void> =>
  queueActiveSessions(async () => {
    const sessions = await getActiveSessions();
    await chrome.storage.session.set({
      [ACTIVE_SESSIONS_SESSION_KEY]: {
        ...sessions,
        [slug]: startedAt
      }
    });
  });

export const removeActiveSession = (slug: string): Promise<void> => removeActiveSessions([slug]);

export const removeActiveSessions = (slugs: string[]): Promise<void> =>
  queueActiveSessions(async () => {
    const sessions = await getActiveSessions();

    for (const slug of slugs) delete sessions[slug];

    await chrome.storage.session.set({ [ACTIVE_SESSIONS_SESSION_KEY]: sessions });
  });

const broadcastListeners = new Set<() => void>();

export const onBroadcastStateChanged = (listener: () => void): void => {
  broadcastListeners.add(listener);
};

export const notifyBroadcastStateChanged = (): void => {
  for (const listener of broadcastListeners) listener();
};