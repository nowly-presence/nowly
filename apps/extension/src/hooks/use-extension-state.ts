import { sendMessage, type NativeStatus } from "@/lib/messages";
import type { CurrentActivity, ExtensionSettings, InstalledPresences, PresenceDebug } from "@/shared/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHostVersion, type HostVersionInfo } from "@/hooks/use-host-version";

type ExtensionState = {
  activity: CurrentActivity | null;
  checkUpdates: () => void;
  checkHostUpdate: () => Promise<void>;
  hostVersionInfo: HostVersionInfo | null;
  connectNative: () => void;
  debug: PresenceDebug | null;
  entries: Array<[string, InstalledPresences[string]]>;
  installQueue: string[];
  isCheckingUpdates: boolean;
  isCheckingHostVersion: boolean;
  isLoading: boolean;
  isUnpacked: boolean;
  nativeStatus: NativeStatus;
  presences: InstalledPresences;
  removePresence: (slug: string) => void;
  installPresenceFromApi: (slug: string) => Promise<{ ok: boolean; queued: boolean }>;
  retryInstallQueue: () => Promise<void>;
  resetOnboardingForDev: () => Promise<void>;
  setPresencePaused: (paused: boolean) => void;
  togglePresence: (slug: string, enabled: boolean) => void;
  updates: Record<string, string>;
  settings: ExtensionSettings;
  setSettings: (partial: Partial<ExtensionSettings>) => void;
  analyticsConsent: boolean;
  setAnalyticsConsent: (granted: boolean) => void;
};

const FALLBACK_NATIVE_STATUS: NativeStatus = {
  connected: false,
  status: "unknown",
  discordConnected: false,
};

const FALLBACK_SETTINGS: ExtensionSettings = {
  presenceDisplayMode: "category",
  separateActivePresence: false,
  showPlayer: true,
  scheduleEnabled: false,
};

export const useExtensionState = (): ExtensionState => {
  const [presences, setPresences] = useState<InstalledPresences>({});
  const [activity, setActivity] = useState<CurrentActivity | null>(null);
  const [nativeStatus, setNativeStatus] = useState<NativeStatus>(FALLBACK_NATIVE_STATUS);
  const [debug, setDebug] = useState<PresenceDebug | null>(null);
  const [updates, setUpdates] = useState<Record<string, string>>({});
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [isUnpacked, setIsUnpacked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [installQueue, setInstallQueue] = useState<string[]>([]);
  const isUnpackedRef = useRef(false);

  useEffect(() => {
    try {
      const unpacked = !chrome.runtime.getManifest().update_url;
      setIsUnpacked(unpacked);
      isUnpackedRef.current = unpacked;
    } catch {
      setIsUnpacked(false);
    }
  }, []);

  const [settings, setSettingsState] = useState<ExtensionSettings>(FALLBACK_SETTINGS);
  const [analyticsConsent, setAnalyticsConsentState] = useState(false);

  const { hostVersionInfo, isCheckingHostVersion, checkHostUpdate, fetchHostVersion } = useHostVersion();

  const entries = useMemo(() => Object.entries(presences), [presences]);

  const refresh = useCallback((): void => {
    void Promise.all([
      sendMessage<InstalledPresences>("GET_PRESENCES"),
      sendMessage<CurrentActivity | null>("GET_CURRENT_ACTIVITY"),
      sendMessage<NativeStatus>("GET_NATIVE_STATUS"),
      sendMessage<PresenceDebug | null>("GET_DEBUG"),
      sendMessage<ExtensionSettings>("GET_SETTINGS"),
      sendMessage<{ items?: Array<{ slug: string }> }>("GET_INSTALL_QUEUE"),
      sendMessage<{ granted?: boolean }>("GET_ANALYTICS_CONSENT"),
    ]).then(([nextPresences, nextActivity, nextNativeStatus, nextDebug, nextSettings, nextQueue, nextConsent]) => {
      setPresences(nextPresences ?? {});
      setActivity(nextActivity ?? null);
      setNativeStatus(nextNativeStatus ?? FALLBACK_NATIVE_STATUS);
      setDebug(nextDebug ?? null);
      setSettingsState(nextSettings ?? FALLBACK_SETTINGS);
      setInstallQueue((nextQueue?.items ?? []).map((item) => item.slug));
      setAnalyticsConsentState(nextConsent?.granted === true);
    }).finally(() => {
      setIsLoading(false);
    });
    void fetchHostVersion();
  }, [fetchHostVersion]);

  const refreshHostUpdate = useCallback(async (): Promise<void> => {
    await checkHostUpdate();
    const nextNativeStatus = await sendMessage<NativeStatus>("GET_NATIVE_STATUS");
    setNativeStatus(nextNativeStatus ?? FALLBACK_NATIVE_STATUS);
  }, [checkHostUpdate]);

  const refreshUpdates = useCallback((): void => {
    if (isUnpackedRef.current) return;
    setIsCheckingUpdates(true);
    void sendMessage<Record<string, string>>("CHECK_UPDATES")
      .then((nextUpdates) => {
        setUpdates(nextUpdates ?? {});
      })
      .finally(() => {
        setIsCheckingUpdates(false);
      });
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 3600000);

    const onStorageChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ): void => {
      if (areaName !== "local") return;
      if (changes.presences || changes.settings || changes.currentActivity || changes.debug || changes.presenceInstallQueue) {
        refresh();
      }
    };
    chrome.storage.onChanged.addListener(onStorageChanged);

    const onRuntimeMessage = (message: Record<string, unknown>): void => {
      if (message.source === "PRESENCES_BACKGROUND" && message.type === "PRESENCES_CHANGED") {
        refresh();
        refreshUpdates();
      }
    };
    chrome.runtime.onMessage.addListener(onRuntimeMessage);

    const onVisible = (): void => {
      if (document.visibilityState !== "visible") return;
      void sendMessage<NativeStatus>("CONNECT_NATIVE").then((status) => {
        setNativeStatus(status ?? FALLBACK_NATIVE_STATUS);
      });
      refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      window.clearInterval(interval);
      chrome.storage.onChanged.removeListener(onStorageChanged);
      chrome.runtime.onMessage.removeListener(onRuntimeMessage);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [refresh, refreshUpdates]);

  const togglePresence = (slug: string, enabled: boolean): void => {
    void sendMessage("TOGGLE_PRESENCE", { slug, enabled }).then(() => {
      setPresences((current) => {
        const presence = current[slug];
        if (!presence) return current;
        return { ...current, [slug]: { ...presence, enabled } };
      });
    });
  };

  const removePresence = (slug: string): void => {
    void sendMessage("UNINSTALL_PRESENCE", { slug }).then(() => {
      setPresences((current) => {
        const next = { ...current };
        delete next[slug];
        return next;
      });
    });
  };

  const installPresenceFromApi = (slug: string): Promise<{ ok: boolean; queued: boolean }> =>
    sendMessage<{ ok?: boolean; queued?: boolean }>("INSTALL_PRESENCE_FROM_API", { slug }).then((result) => ({
      ok: result?.ok === true,
      queued: result?.queued === true,
    }));

  const retryInstallQueue = useCallback(async (): Promise<void> => {
    await sendMessage("RETRY_INSTALL_QUEUE");
    refresh();
  }, [refresh]);

  const setPresencePaused = useCallback((paused: boolean): void => {
    void sendMessage<{ paused?: boolean }>("SET_PRESENCE_PAUSE", { paused }).then((result) => {
      if (typeof result?.paused === "boolean") {
        setSettingsState((current) => ({ ...current, presencePaused: result.paused }));
      }
    });
  }, []);

  const connectNative = (): void => {
    setNativeStatus((current) => ({ ...current, status: "connecting" }));
    void sendMessage<NativeStatus>("CONNECT_NATIVE").then((status) => {
      setNativeStatus(status ?? FALLBACK_NATIVE_STATUS);
    });
  };

  const setSettings = useCallback((partial: Partial<ExtensionSettings>): void => {
    void sendMessage<ExtensionSettings>("SET_SETTINGS", partial).then((next) => {
      if (next) setSettingsState(next);
    });
  }, []);

  const resetOnboardingForDev = useCallback(async (): Promise<void> => {
    const next = await sendMessage<ExtensionSettings>("RESET_ONBOARDING_FOR_DEV");
    if (next) setSettingsState(next);
  }, []);

  const setAnalyticsConsent = useCallback((granted: boolean): void => {
    void sendMessage<{ granted?: boolean }>("SET_ANALYTICS_CONSENT", { granted }).then((next) => {
      setAnalyticsConsentState(next?.granted === true);
    });
  }, []);

  return {
    activity,
    checkUpdates: refreshUpdates,
    checkHostUpdate: refreshHostUpdate,
    hostVersionInfo,
    isCheckingHostVersion,
    connectNative,
    debug,
    entries,
    installQueue,
    isLoading,
    isCheckingUpdates,
    isUnpacked,
    nativeStatus,
    presences,
    removePresence,
    installPresenceFromApi,
    retryInstallQueue,
    resetOnboardingForDev,
    setPresencePaused,
    togglePresence,
    updates,
    settings,
    setSettings,
    analyticsConsent,
    setAnalyticsConsent,
  };
};
