import { sendMessage, type NativeStatus } from "@/lib/messages";
import type { DiscordProfileSnapshot } from "@/shared/types";
import { useEffect, useState } from "react";

const ONBOARDING_KEY = "onboarding";

export type OnboardingState = {
  devReplayOnboarding: boolean;
  onboardingCompleted: boolean;
  nativeSeenConnectedOnce: boolean;
  nativeProfile?: DiscordProfileSnapshot | null;
};

const DEFAULT_ONBOARDING: OnboardingState = {
  devReplayOnboarding: false,
  onboardingCompleted: false,
  nativeSeenConnectedOnce: false,
  nativeProfile: null,
};

const readOnboarding = async (): Promise<OnboardingState> => {
  const result = await chrome.storage.local.get(ONBOARDING_KEY);
  const value = result[ONBOARDING_KEY] as Partial<OnboardingState> | undefined;
  return { ...DEFAULT_ONBOARDING, ...(value ?? {}) };
};

const writeOnboarding = async (partial: Partial<OnboardingState>): Promise<OnboardingState> => {
  const current = await readOnboarding();
  const next = { ...current, ...partial } satisfies OnboardingState;
  await chrome.storage.local.set({ [ONBOARDING_KEY]: next });
  return next;
};

export type UserScriptsStatus = {
  enabled: boolean;
  reason?: string;
  requiresUserToggle?: boolean;
};

export const useOnboardingState = (): {
  onboarding: OnboardingState;
  setOnboarding: (partial: Partial<OnboardingState>) => void;
  nativeStatus: NativeStatus;
  userScripts: UserScriptsStatus;
  refresh: () => void;
} => {
  const [onboarding, setOnboardingState] = useState<OnboardingState>(DEFAULT_ONBOARDING);
  const [nativeStatus, setNativeStatus] = useState<NativeStatus>({ connected: false, status: "unknown", discordConnected: false });
  const [userScripts, setUserScripts] = useState<UserScriptsStatus>({ enabled: false, requiresUserToggle: true });

  const refresh = (): void => {
    void Promise.all([
      readOnboarding(),
      sendMessage<NativeStatus>("GET_NATIVE_STATUS"),
      sendMessage<UserScriptsStatus>("GET_USER_SCRIPTS_STATUS"),
    ]).then(([nextOnboarding, nextNative, nextUserScripts]) => {
      setOnboardingState(nextOnboarding);
      setNativeStatus(nextNative ?? { connected: false, status: "unknown", discordConnected: false });
      setUserScripts(nextUserScripts ?? { enabled: false, requiresUserToggle: true });
    });
  };

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 1500);

    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, areaName: string): void => {
      if (areaName !== "local") return;
      if (!changes[ONBOARDING_KEY]) return;

      const next = changes[ONBOARDING_KEY].newValue as Partial<OnboardingState> | undefined;
      setOnboardingState({ ...DEFAULT_ONBOARDING, ...(next ?? {}) });
    };

    chrome.storage.onChanged.addListener(onChanged);
    return () => {
      window.clearInterval(interval);
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  const setOnboarding = (partial: Partial<OnboardingState>): void => {
    void writeOnboarding(partial).then((next) => setOnboardingState(next));
  };

  return {
    onboarding,
    setOnboarding,
    nativeStatus,
    userScripts,
    refresh
  };
};