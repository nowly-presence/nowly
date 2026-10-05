export type Season = "spring" | "summer" | "autumn" | "winter" | "halloween" | "new-year"
export type SeasonOverride = Season | "none"
export type SeasonKind = "season" | "event"

type MonthDay = { month: number; day: number }

type SeasonPeriod = { season: Season; kind: SeasonKind; from: MonthDay; to: MonthDay; moment: MonthDay | null; enabled: boolean; lastYear?: number }

const JANUARY = 0
const MARCH = 2
const JUNE = 5
const SEPTEMBER = 8
const OCTOBER = 9
const DECEMBER = 11
const PRANK_DAY = 31
const LAST_HALLOWEEN_THEME_YEAR = 2026

export const SEASON_OVERRIDE_KEY = "seasonOverride"

export const SEASON_PERIODS: readonly SeasonPeriod[] = [
  { season: "halloween", kind: "event", from: { month: OCTOBER, day: 1 }, to: { month: OCTOBER, day: 31 }, moment: { month: OCTOBER, day: PRANK_DAY }, enabled: true, lastYear: LAST_HALLOWEEN_THEME_YEAR },
  { season: "new-year", kind: "event", from: { month: DECEMBER, day: 31 }, to: { month: JANUARY, day: 1 }, moment: { month: JANUARY, day: 1 }, enabled: true },
  { season: "spring", kind: "season", from: { month: MARCH, day: 17 }, to: { month: MARCH, day: 23 }, moment: { month: MARCH, day: 20 }, enabled: true },
  { season: "summer", kind: "season", from: { month: JUNE, day: 18 }, to: { month: JUNE, day: 24 }, moment: { month: JUNE, day: 21 }, enabled: true },
  { season: "autumn", kind: "season", from: { month: SEPTEMBER, day: 19 }, to: { month: SEPTEMBER, day: 25 }, moment: { month: SEPTEMBER, day: 22 }, enabled: true },
  { season: "winter", kind: "season", from: { month: DECEMBER, day: 18 }, to: { month: DECEMBER, day: 26 }, moment: { month: DECEMBER, day: 21 }, enabled: true },
]

export const ENABLED_SEASONS: readonly Season[] = SEASON_PERIODS.filter((period) => period.enabled).map((period) => period.season)

export const isSeason = (value: unknown): value is Season => SEASON_PERIODS.some((period) => period.season === value)

export const isSeasonOverride = (value: unknown): value is SeasonOverride => value === "none" || isSeason(value)

const dayIndex = ({ month, day }: MonthDay): number => month * 100 + day

const inPeriod = (date: Date, { from, to, lastYear }: SeasonPeriod): boolean => {
  if (lastYear !== undefined && date.getFullYear() > lastYear) return false
  const today = dayIndex({ month: date.getMonth(), day: date.getDate() })
  const start = dayIndex(from)
  const end = dayIndex(to)
  return start <= end ? today >= start && today <= end : today >= start || today <= end
}

const byKind = (period: SeasonPeriod): number => (period.kind === "event" ? 0 : 1)

export const seasonForDate = (date: Date, periods: readonly SeasonPeriod[] = SEASON_PERIODS): Season | null => {
  const match = [...periods].sort((a, b) => byKind(a) - byKind(b)).find((period) => period.enabled && inPeriod(date, period))
  return match?.season ?? null
}

export const resolveSeason = ({ enabled, date, override }: { enabled: boolean; date: Date; override?: SeasonOverride | null }): Season | null => {
  if (!enabled || override === "none") return null
  return override ?? seasonForDate(date)
}

export const seasonMomentFor = (season: Season): MonthDay | null => SEASON_PERIODS.find((period) => period.season === season)?.moment ?? null

export const isSeasonMomentDay = (season: Season, date: Date): boolean => {
  const moment = seasonMomentFor(season)
  return moment !== null && moment.month === date.getMonth() && moment.day === date.getDate()
}

export const isPrankDay = (date: Date): boolean => isSeasonMomentDay("halloween", date)

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
