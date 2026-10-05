import { isSeason, isSeasonMomentDay, type Season } from "@/shared/seasonal-themes"

export const SEASON_MOMENTS_KEY = "seasonMoments"

export type MomentSeason = Exclude<Season, "halloween">

export type SeasonMomentsState = { shown?: Partial<Record<Season, number>>; replay?: boolean }

export const isMomentSeason = (season: Season | null): season is MomentSeason => season !== null && season !== "halloween"

export const isSeasonMomentsState = (value: unknown): value is SeasonMomentsState => {
  if (!value || typeof value !== "object") return false
  const { shown, replay } = value as SeasonMomentsState
  if (replay !== undefined && typeof replay !== "boolean") return false
  if (shown === undefined) return true
  if (!shown || typeof shown !== "object") return false
  return Object.entries(shown).every(([season, year]) => isSeason(season) && typeof year === "number")
}

export const isSeasonMomentDue = (state: SeasonMomentsState | null, season: Season | null, date: Date): season is MomentSeason => {
  if (!isMomentSeason(season)) return false
  return state?.replay === true || (isSeasonMomentDay(season, date) && state?.shown?.[season] !== date.getFullYear())
}

export const markSeasonMomentShown = (state: SeasonMomentsState | null, season: MomentSeason, date: Date): SeasonMomentsState => {
  const shown = { ...state?.shown, ...(isSeasonMomentDay(season, date) ? { [season]: date.getFullYear() } : {}) }
  return Object.keys(shown).length > 0 ? { shown } : {}
}

export const loadSeasonMoments = async (): Promise<SeasonMomentsState | null> => {
  const result = await chrome.storage.local.get(SEASON_MOMENTS_KEY)
  const value: unknown = result[SEASON_MOMENTS_KEY]
  return isSeasonMomentsState(value) ? value : null
}

export const saveSeasonMoments = (state: SeasonMomentsState): Promise<void> => chrome.storage.local.set({ [SEASON_MOMENTS_KEY]: state })

export const replaySeasonMoment = async (): Promise<void> => saveSeasonMoments({ ...(await loadSeasonMoments()), replay: true })
