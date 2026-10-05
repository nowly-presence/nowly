export const FEATURE_REVEALS_KEY = "featureReveals"

export type FeatureRevealsState = Record<string, number>

const parseVersion = (value: string): number[] => value.split(".").map((part) => Number.parseInt(part, 10) || 0)

export const isRevealVersionCurrent = (revealVersion: string, currentVersion: string): boolean => {
  const [revealMajor = 0, revealMinor = 0, revealPatch = 0] = parseVersion(revealVersion)
  const [major = 0, minor = 0, patch = 0] = parseVersion(currentVersion)
  return major === revealMajor && minor === revealMinor && patch >= revealPatch
}

export const isFeatureRevealsState = (value: unknown): value is FeatureRevealsState =>
  Boolean(value) && typeof value === "object" && Object.values(value as object).every((entry) => typeof entry === "number")

export const isRevealDue = (id: string, revealVersion: string, currentVersion: string, seen: FeatureRevealsState): boolean =>
  !(id in seen) && isRevealVersionCurrent(revealVersion, currentVersion)

export const loadFeatureReveals = async (): Promise<FeatureRevealsState> => {
  const result = await chrome.storage.local.get(FEATURE_REVEALS_KEY)
  const value = result[FEATURE_REVEALS_KEY]
  return isFeatureRevealsState(value) ? value : {}
}

export const markFeatureRevealSeen = async (id: string, now = Date.now()): Promise<void> => {
  const current = await loadFeatureReveals()
  await chrome.storage.local.set({ [FEATURE_REVEALS_KEY]: { ...current, [id]: now } })
}

export const resetFeatureReveals = (): Promise<void> => chrome.storage.local.remove(FEATURE_REVEALS_KEY)
