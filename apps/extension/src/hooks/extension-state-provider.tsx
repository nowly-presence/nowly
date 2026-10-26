import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { OnboardingState } from "@/background/storage/onboarding.store";
import { sendMessage } from "@/lib/messages";
import { useI18n } from "@/hooks/i18n-provider";
import { ANNOUNCEMENTS_KEY, emptyAnnouncements, normalizeAnnouncements, type AnnouncementsState } from "@/shared/announcements";
import { startAnnouncementUpdates } from "@/shared/announcements-live";
import type { AccountSnapshot, CurrentActivity, CustomActivitiesState, CustomActivityDetection, ExtensionSettings, InstalledPresences, NativeStatus, PresenceCatalogItem, TabState, UserScriptsStatus } from "@/shared/types";

export type CatalogState = {
  status: "idle" | "loading";
  items: PresenceCatalogItem[];
} | {
  status: "ready";
  items: PresenceCatalogItem[];
} | {
  status: "error";
  items: PresenceCatalogItem[];
  error: string;
};

export type ExtensionState = {
  announcements: AnnouncementsState;
  ready: boolean;
  presences: InstalledPresences;
  settings: ExtensionSettings;
  activity: CurrentActivity | null;
  native: NativeStatus;
  userScripts: UserScriptsStatus;
  onboarding: OnboardingState;
  tab: TabState;
  presenceSettings: Record<string, Record<string, unknown>>;
  analyticsConsent: boolean;
  updates: Record<string, string>;
  catalog: CatalogState;
  customActivities: CustomActivitiesState;
  detection: CustomActivityDetection | null;
  account: AccountSnapshot;
};

const INITIAL: ExtensionState = {
  announcements: emptyAnnouncements(),
  ready: false,
  presences: {},
  settings: {
    presenceDisplayMode: "category",
    showPlayer: true
  },
  activity: null,
  native: {
    connected: false,
    status: "connecting"
  },
  userScripts: { enabled: true },
  onboarding: {
    devReplayOnboarding: false,
    onboardingCompleted: true,
    nativeSeenConnectedOnce: false,
    nativeProfile: null
  },
  tab: {
    tabId: null,
    hostname: null,
    muted: false,
    installedSlug: null,
    activities: []
  },
  presenceSettings: {},
  analyticsConsent: false,
  updates: {},
  catalog: {
    status: "idle",
    items: []
  },
  customActivities: {
    items: [],
    activeId: null,
    activatedAt: null
  },
  detection: null,
  account: { signedIn: false }
};

type Refreshers = {
  announcements: () => Promise<void>;
  presences: () => Promise<void>;
  settings: () => Promise<void>;
  activity: () => Promise<void>;
  native: () => Promise<void>;
  userScripts: () => Promise<void>;
  onboarding: () => Promise<void>;
  tab: () => Promise<void>;
  presenceSettings: () => Promise<void>;
  consent: () => Promise<void>;
  updates: () => Promise<void>;
  catalog: (force?: boolean) => Promise<void>;
  customActivities: () => Promise<void>;
  detection: () => Promise<void>;
  account: () => Promise<void>;
};

type ExtensionStateValue = {
  state: ExtensionState;
  refresh: Refreshers;
  patch: (partial: Partial<ExtensionState>) => void;
  updateSettings: (partial: Partial<ExtensionSettings>) => Promise<ExtensionSettings>;
};

const ExtensionStateContext = createContext<ExtensionStateValue | null>(null);

const NATIVE_POLL_MS = 3000;

export const ExtensionStateProvider = ({ children }: {
  children: ReactNode;
}) => {
  const [state, setState] = useState<ExtensionState>(INITIAL);
  const { locale } = useI18n();
  const catalogInFlight = useRef<Promise<void> | null>(null);

  const patch = useCallback((partial: Partial<ExtensionState>) => setState((current) => ({ ...current, ...partial })), []);

  const refresh = useMemo<Refreshers>(() => {
    const safe =
      <T,>(loader: () => Promise<T>, apply: (value: T) => void) =>
      async () => {
        try {
          const value = await loader();
          if (value !== undefined) apply(value);
        } catch {}
      };

    return {
      announcements: safe(
        () => sendMessage("GET_ANNOUNCEMENTS"),
        (announcements) => patch({ announcements: normalizeAnnouncements(announcements) })
      ),
      presences: safe(
        () => sendMessage("GET_PRESENCES"),
        (presences) => patch({ presences })
      ),
      settings: safe(
        () => sendMessage("GET_SETTINGS"),
        (settings) => patch({ settings })
      ),
      activity: safe(
        () => sendMessage("GET_CURRENT_ACTIVITY"),
        (activity) => patch({ activity })
      ),
      native: safe(
        () => sendMessage("GET_NATIVE_STATUS"),
        (native) => patch({ native })
      ),
      userScripts: safe(
        () => sendMessage("GET_USER_SCRIPTS_STATUS"),
        (userScripts) =>
          setState((current) => {
            if (userScripts.enabled && !current.userScripts.enabled) void sendMessage("SYNC_PRESENCE_SCRIPTS").catch(() => {});
            return { ...current, userScripts };
          })
      ),
      onboarding: safe(
        () => sendMessage("GET_ONBOARDING"),
        (onboarding) => patch({ onboarding })
      ),
      tab: safe(
        () => sendMessage("GET_TAB_STATE"),
        (tab) => patch({ tab })
      ),
      presenceSettings: safe(
        () => sendMessage("GET_PRESENCE_SETTINGS"),
        (presenceSettings) => patch({ presenceSettings })
      ),
      consent: safe(
        () => sendMessage("GET_ANALYTICS_CONSENT"),
        ({ granted }) => patch({ analyticsConsent: granted })
      ),
      updates: safe(
        () => sendMessage("CHECK_UPDATES"),
        (updates) => patch({ updates })
      ),
      customActivities: safe(
        () => sendMessage("GET_CUSTOM_ACTIVITIES"),
        (customActivities) => patch({ customActivities })
      ),
      detection: safe(
        () => sendMessage("GET_CUSTOM_ACTIVITY_DETECTION"),
        (detection) => patch({ detection })
      ),
      account: safe(
        () => sendMessage("GET_ACCOUNT"),
        (account) => patch({ account })
      ),
      catalog: async (force = false) => {
        if (catalogInFlight.current) return catalogInFlight.current;

        let skip = false;
        setState((current) => {
          if (!force && current.catalog.status === "ready") {
            skip = true;
            return current;
          }

          return {
            ...current,
            catalog: {
              status: "loading",
              items: current.catalog.items
            }
          };
        });

        if (skip) return;

        catalogInFlight.current = (async () => {
          try {
            const response = await sendMessage("FETCH_PRESENCE_CATALOG");
            setState((current) => ({
              ...current,
              catalog: response.ok ? { status: "ready", items: response.items } : { status: "error", items: current.catalog.items, error: response.error }
            }));
          } catch (error) {
            setState((current) => ({
              ...current,
              catalog: {
                status: "error",
                items: current.catalog.items,
                error: error instanceof Error ? error.message : "CATALOG_REQUEST_FAILED"
              }
            }));
          } finally {
            catalogInFlight.current = null;
          }
        })();
        return catalogInFlight.current;
      }
    };
  }, [patch]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.all([
        refresh.announcements(),
        refresh.presences(),
        refresh.settings(),
        refresh.activity(),
        refresh.native(),
        refresh.userScripts(),
        refresh.onboarding(),
        refresh.tab(),
        refresh.presenceSettings(),
        refresh.consent(),
        refresh.customActivities(),
        refresh.detection(),
        refresh.account()
      ]);
      if (!cancelled) patch({ ready: true });
      void sendMessage("SYNC_ACCOUNT")
        .then((account) => patch({ account }))
        .catch(() => {});
      void refresh.catalog();
      void refresh.updates();
      void sendMessage("RECORD_EXTENSION_ACTIVE").catch(() => {});
      void sendMessage("RECORD_USAGE_DAY").catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [patch, refresh]);

  useEffect(() => {
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === "session") {
        if ("tabPresences" in changes || "mutedTabIds" in changes) void refresh.tab();
        if ("customActivityDetection" in changes) void refresh.detection();
        return;
      }
      if (area !== "local") return;

      if ("presences" in changes) {
        void refresh.presences();
        void refresh.tab();
      }

      if ("settings" in changes) void refresh.settings();
      if (ANNOUNCEMENTS_KEY in changes) void refresh.announcements();
      if ("currentActivity" in changes) void refresh.activity();
      if ("presenceSettings" in changes) void refresh.presenceSettings();
      if ("onboarding" in changes) void refresh.onboarding();
      if ("analyticsConsent" in changes) void refresh.consent();
      if ("customActivities" in changes) void refresh.customActivities();
      if ("account" in changes || "syncState" in changes) void refresh.account();
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, [refresh]);

  useEffect(() =>
    startAnnouncementUpdates(state.announcements.apiBaseUrl, async () => {
      const announcements = await sendMessage("REFRESH_ANNOUNCEMENTS", { locale });
      patch({ announcements: normalizeAnnouncements(announcements) });
    }), [state.announcements.apiBaseUrl, locale, patch]);

  useEffect(() => {
    const onMessage = (message: {
      source?: string;
      type?: string;
    }) => {
      if (message?.source === "PRESENCES_BACKGROUND" && message.type === "PRESENCES_CHANGED") void refresh.presences();
    };
    chrome.runtime.onMessage.addListener(onMessage);

    const onTab = () => void refresh.tab();
    const onTabUpdated = (_id: number, info: {
      url?: string;
      status?: string;
    }) => {
      if (info.url || info.status === "complete") void refresh.tab();
    };
    chrome.tabs?.onActivated?.addListener(onTab);
    chrome.tabs?.onUpdated?.addListener(onTabUpdated);
    chrome.windows?.onFocusChanged?.addListener(onTab);
    return () => {
      chrome.runtime.onMessage.removeListener(onMessage);
      chrome.tabs?.onActivated?.removeListener(onTab);
      chrome.tabs?.onUpdated?.removeListener(onTabUpdated);
      chrome.windows?.onFocusChanged?.removeListener(onTab);
    };
  }, [refresh]);

  useEffect(() => {
    let ticks = 0;
    const tick = () => {
      if (document.visibilityState !== "visible") return;

      void refresh.native();
      if (ticks++ % 2 === 0) void refresh.userScripts();
    };
    const id = window.setInterval(tick, NATIVE_POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  const updateSettings = useCallback(async (partial: Partial<ExtensionSettings>) => {
    setState((current) => ({
      ...current,
      settings: { ...current.settings, ...partial }
    }));
    const next = await sendMessage("SET_SETTINGS", partial);
    patch({ settings: next });
    return next;
  }, [patch]);

  const value = useMemo(() => ({ state, refresh, patch, updateSettings }), [state, refresh, patch, updateSettings]);
  return (
    <ExtensionStateContext.Provider value={value}>
      {children}
    </ExtensionStateContext.Provider>
  );
};

export const useExtensionState = (): ExtensionStateValue => {
  const value = useContext(ExtensionStateContext);

  if (!value) throw new Error("useExtensionState must be used inside <ExtensionStateProvider>");

  return value;
};