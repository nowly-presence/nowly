import { isPrankDay } from "@/shared/seasonal-themes"

export const HALLOWEEN_PRANK_KEY = "halloweenPrank"

export type HalloweenPrankState = { lastShownYear?: number; replay?: boolean }

export const isHalloweenPrankState = (value: unknown): value is HalloweenPrankState => {
  if (!value || typeof value !== "object") return false
  const { lastShownYear, replay } = value as HalloweenPrankState
  return (lastShownYear === undefined || typeof lastShownYear === "number") && (replay === undefined || typeof replay === "boolean")
}

export const isHalloweenPrankDue = (state: HalloweenPrankState | null, date: Date): boolean =>
  state?.replay === true || (isPrankDay(date) && state?.lastShownYear !== date.getFullYear())

export const markHalloweenPrankShown = (state: HalloweenPrankState | null, date: Date): HalloweenPrankState => {
  const lastShownYear = isPrankDay(date) ? date.getFullYear() : state?.lastShownYear
  return lastShownYear === undefined ? {} : { lastShownYear }
}

export const loadHalloweenPrank = async (): Promise<HalloweenPrankState | null> => {
  const result = await chrome.storage.local.get(HALLOWEEN_PRANK_KEY)
  const value: unknown = result[HALLOWEEN_PRANK_KEY]
  return isHalloweenPrankState(value) ? value : null
}

export const saveHalloweenPrank = (state: HalloweenPrankState): Promise<void> => chrome.storage.local.set({ [HALLOWEEN_PRANK_KEY]: state })

export const replayHalloweenPrank = async (): Promise<void> => saveHalloweenPrank({ ...(await loadHalloweenPrank()), replay: true })
