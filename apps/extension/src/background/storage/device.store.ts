import { STORAGE_KEYS } from "@/background/storage/keys"

export const getDeviceId = async (): Promise<string> => {
  const result = await chrome.storage.local.get(STORAGE_KEYS.deviceId)
  const existing = result[STORAGE_KEYS.deviceId]
  if (typeof existing === "string" && existing.trim()) return existing

  const deviceId = crypto.randomUUID()
  await chrome.storage.local.set({ [STORAGE_KEYS.deviceId]: deviceId })
  return deviceId
}

export const getDeviceToken = async (): Promise<string | null> => {
  const result = await chrome.storage.local.get(STORAGE_KEYS.deviceToken)
  const value = result[STORAGE_KEYS.deviceToken]
  return typeof value === "string" && value.trim() ? value : null
}

export const setDeviceToken = async (token: string): Promise<void> => {
  await chrome.storage.local.set({ [STORAGE_KEYS.deviceToken]: token })
}

export const getAnalyticsConsent = async (): Promise<boolean> => {
  const result = await chrome.storage.local.get(STORAGE_KEYS.analyticsConsent)
  return result[STORAGE_KEYS.analyticsConsent] === true
}

export const setAnalyticsConsent = async (granted: boolean): Promise<boolean> => {
  await chrome.storage.local.set({ [STORAGE_KEYS.analyticsConsent]: granted })
  return granted
}
