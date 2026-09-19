import { useEffect, useState } from "react"
import { DEFAULT_ONBOARDING, getOnboarding, setOnboarding as writeOnboarding, type OnboardingState } from "@/background/storage/onboarding.store"
import { sendMessage } from "@/lib/messages"
import type { NativeStatus, UserScriptsStatus } from "@/shared/types"

const FALLBACK_NATIVE_STATUS: NativeStatus = { connected: false, status: "unknown", discordConnected: false }
const FALLBACK_USER_SCRIPTS_STATUS: UserScriptsStatus = { enabled: false, requiresUserToggle: true }

export const useOnboardingState = (): {
  onboarding: OnboardingState
  setOnboarding: (partial: Partial<OnboardingState>) => void
  nativeStatus: NativeStatus
  userScripts: UserScriptsStatus
  refresh: () => void
} => {
  const [onboarding, setOnboardingState] = useState<OnboardingState>(DEFAULT_ONBOARDING)
  const [nativeStatus, setNativeStatus] = useState<NativeStatus>(FALLBACK_NATIVE_STATUS)
  const [userScripts, setUserScripts] = useState<UserScriptsStatus>(FALLBACK_USER_SCRIPTS_STATUS)

  const refresh = (): void => {
    void Promise.all([getOnboarding(), sendMessage("GET_NATIVE_STATUS"), sendMessage("GET_USER_SCRIPTS_STATUS")]).then(([nextOnboarding, nextNative, nextUserScripts]) => {
      setOnboardingState(nextOnboarding)
      setNativeStatus(nextNative ?? FALLBACK_NATIVE_STATUS)
      setUserScripts(nextUserScripts ?? FALLBACK_USER_SCRIPTS_STATUS)
    })
  }

  useEffect(() => {
    refresh()

    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, areaName: string): void => {
      if (areaName !== "local") return
      if (!changes.onboarding) return
      setOnboardingState({ ...DEFAULT_ONBOARDING, ...((changes.onboarding.newValue as Partial<OnboardingState>) ?? {}) })
    }

    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  const setOnboarding = (partial: Partial<OnboardingState>): void => {
    void writeOnboarding(partial).then(refresh)
  }

  return { onboarding, setOnboarding, nativeStatus, userScripts, refresh }
}
