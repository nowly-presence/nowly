import { STORAGE_KEYS } from "@/background/storage/keys"
import type { DiscordProfileSnapshot } from "@/shared/types"

// Sole definition of OnboardingState/DEFAULT_ONBOARDING - the old extension
// duplicated this type between storage.ts and the UI hook, letting the two
// drift silently. Everything (background and UI) imports from here.
export type OnboardingState = {
  devReplayOnboarding: boolean
  onboardingCompleted: boolean
  nativeSeenConnectedOnce: boolean
  nativeProfile?: DiscordProfileSnapshot | null
}

export const DEFAULT_ONBOARDING: OnboardingState = {
  devReplayOnboarding: false,
  onboardingCompleted: false,
  nativeSeenConnectedOnce: false,
  nativeProfile: null,
}

export const getOnboarding = async (): Promise<OnboardingState> => {
  const result = await chrome.storage.local.get(STORAGE_KEYS.onboarding)
  const value = result[STORAGE_KEYS.onboarding] as Partial<OnboardingState> | undefined
  return { ...DEFAULT_ONBOARDING, ...(value ?? {}) }
}

export const setOnboarding = async (partial: Partial<OnboardingState>): Promise<void> => {
  const current = await getOnboarding()
  await chrome.storage.local.set({ [STORAGE_KEYS.onboarding]: { ...current, ...partial } satisfies OnboardingState })
}

export const setNativeSeenConnectedOnce = (seen: boolean): Promise<void> => setOnboarding({ nativeSeenConnectedOnce: seen })

export const setNativeProfile = (profile: DiscordProfileSnapshot | null): Promise<void> => setOnboarding({ nativeProfile: profile })
