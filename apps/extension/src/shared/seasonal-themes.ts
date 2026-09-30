export type Season = "halloween" | "winter"
export type SeasonOverride = Season | "none"

type SeasonPeriod = { season: Season; month: number; firstDay: number; lastDay: number; enabled: boolean }

const OCTOBER = 9
const DECEMBER = 11
const PRANK_DAY = 31

export const SEASON_OVERRIDE_KEY = "seasonOverride"

export const SEASON_PERIODS: readonly SeasonPeriod[] = [
  { season: "halloween", month: OCTOBER, firstDay: 1, lastDay: 31, enabled: true },
  { season: "winter", month: DECEMBER, firstDay: 1, lastDay: 31, enabled: false },
]

export const ENABLED_SEASONS: readonly Season[] = SEASON_PERIODS.filter((period) => period.enabled).map((period) => period.season)

export const isSeason = (value: unknown): value is Season => SEASON_PERIODS.some((period) => period.season === value)

export const isSeasonOverride = (value: unknown): value is SeasonOverride => value === "none" || isSeason(value)

export const seasonForDate = (date: Date, periods: readonly SeasonPeriod[] = SEASON_PERIODS): Season | null => {
  const month = date.getMonth()
  const day = date.getDate()
  const match = periods.find((period) => period.enabled && period.month === month && day >= period.firstDay && day <= period.lastDay)
  return match?.season ?? null
}

export const resolveSeason = ({ enabled, date, override }: { enabled: boolean; date: Date; override?: SeasonOverride | null }): Season | null => {
  if (!enabled || override === "none") return null
  return override ?? seasonForDate(date)
}

export const isPrankDay = (date: Date): boolean => date.getMonth() === OCTOBER && date.getDate() === PRANK_DAY

export const msUntilNextDay = (date: Date): number => {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
  return next.getTime() - date.getTime()
}

export const loadSeasonOverride = async (): Promise<SeasonOverride | null> => {
  const result = await chrome.storage.local.get(SEASON_OVERRIDE_KEY)
  const value: unknown = result[SEASON_OVERRIDE_KEY]
  return isSeasonOverride(value) ? value : null
}

export const saveSeasonOverride = (override: SeasonOverride | null): Promise<void> =>
  override ? chrome.storage.local.set({ [SEASON_OVERRIDE_KEY]: override }) : chrome.storage.local.remove(SEASON_OVERRIDE_KEY)
