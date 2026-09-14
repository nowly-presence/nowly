import { sendMessage, type NativeStatus } from "@/lib/messages";
import type { CurrentActivity, ExtensionSettings, InstalledPresences, PresenceDebug, SupporterStatus } from "@/shared/types";
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
  isCheckingUpdates: boolean;
  isCheckingHostVersion: boolean;
  isLoading: boolean;
  isUnpacked: boolean;
  nativeStatus: NativeStatus;
  presences: InstalledPresences;
  removePresence: (slug: string) => void;
  installPresenceFromApi: (slug: string) => Promise<boolean>;
  resetOnboardingForDev: () => Promise<void>;
  togglePresence: (slug: string, enabled: boolean) => void;
  updates: Record<string, string>;
  settings: ExtensionSettings;
  setSettings: (partial: Partial<ExtensionSettings>) => void;
  supporterStatus: SupporterStatus;
  dismissSupporterThankYou: () => void;
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
};

const FALLBACK_SUPPORTER_STATUS: SupporterStatus = {
  adFree: false,
  hasAds: true,
};

export const useExtensionState = (): ExtensionState => {
  const [presences, setPresences] = useState<InstalledPresences>({});
  const [activity, setActivity] = useState<CurrentActivity | null>(null);
  const [nativeStatus, setNativeStatus] = useState<NativeStatus>(FALLBACK_NATIVE_STATUS);
  const [debug, setDebug] = useState<PresenceDebug | null>(null);
  const [updates, setUpdates] = useState<Record<string, string>>({});
  const [supporterStatus, setSupporterStatus] = useState<SupporterStatus>(FALLBACK_SUPPORTER_STATUS);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [isUnpacked, setIsUnpacked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  const { hostVersionInfo, isCheckingHostVersion, checkHostUpdate, fetchHostVersion } = useHostVersion();

  const entries = useMemo(() => Object.entries(presences), [presences]);

  const refresh = useCallback((): void => {
    void Promise.all([
      sendMessage<InstalledPresences>("GET_PRESENCES"),
      sendMessage<CurrentActivity | null>("GET_CURRENT_ACTIVITY"),
      sendMessage<NativeStatus>("GET_NATIVE_STATUS"),
      sendMessage<PresenceDebug | null>("GET_DEBUG"),
      sendMessage<ExtensionSettings>("GET_SETTINGS"),
      sendMessage<SupporterStatus>("GET_SUPPORTER_STATUS"),
    ]).then(([nextPresences, nextActivity, nextNativeStatus, nextDebug, nextSettings, nextSupporterStatus]) => {
      setPresences(nextPresences ?? {});
      setActivity(nextActivity ?? null);
      setNativeStatus(nextNativeStatus ?? FALLBACK_NATIVE_STATUS);
      setDebug(nextDebug ?? null);
      setSettingsState(nextSettings ?? FALLBACK_SETTINGS);
      setSupporterStatus(nextSupporterStatus ?? FALLBACK_SUPPORTER_STATUS);
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
      if (changes.presences || changes.settings || changes.currentActivity || changes.debug || changes.supporterStatus) {
        refresh();
      }
    };
    chrome.storage.onChanged.addListener(onStorageChanged);

    const onRuntimeMessage = (message: Record<string, unknown>): void => {
      if (message.source === "PRESENCES_BACKGROUND" && message.type === "PRESENCES_CHANGED") {
        refresh();
        refreshUpdates();
      }
      if (message.source === "PRESENCES_CONTENT" && message.type === "SUPPORTER_STATUS_CHANGED") {
        refresh();
      }
    };
    chrome.runtime.onMessage.addListener(onRuntimeMessage);

    return () => {
      window.clearInterval(interval);
      chrome.storage.onChanged.removeListener(onStorageChanged);
      chrome.runtime.onMessage.removeListener(onRuntimeMessage);
    };
  }, [refresh]);

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

  const installPresenceFromApi = (slug: string): Promise<boolean> =>
    sendMessage<{ ok?: boolean }>("INSTALL_PRESENCE_FROM_API", { slug }).then((result) => result?.ok === true);

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

  const dismissSupporterThankYou = useCallback((): void => {
    void sendMessage<SupporterStatus>("DISMISS_SUPPORTER_THANK_YOU").then((next) => {
      if (next) setSupporterStatus(next);
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
    isLoading,
    isCheckingUpdates,
    isUnpacked,
    nativeStatus,
    presences,
    removePresence,
    installPresenceFromApi,
    resetOnboardingForDev,
    togglePresence,
    updates,
    settings,
    setSettings,
    supporterStatus,
    dismissSupporterThankYou,
  };
};
