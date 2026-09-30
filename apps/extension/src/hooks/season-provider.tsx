import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { isSeasonOverride, loadSeasonOverride, msUntilNextDay, resolveSeason, SEASON_OVERRIDE_KEY, SEASON_PERIODS, type Season, type SeasonOverride } from "@/shared/seasonal-themes"

type SeasonValue = { season: Season | null; seasonal: boolean; today: Date; override: SeasonOverride | null }

const SeasonContext = createContext<SeasonValue>({ season: null, seasonal: false, today: new Date(), override: null })

const MIDNIGHT_MARGIN_MS = 1000

const sameDay = (a: Date, b: Date): boolean => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const useToday = (): Date => {
  const [today, setToday] = useState(() => new Date())
  useEffect(() => {
    const refresh = () => setToday((current) => {
      const now = new Date()
      return sameDay(current, now) ? current : now
    })
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh()
    }
    const timer = window.setTimeout(refresh, msUntilNextDay(today) + MIDNIGHT_MARGIN_MS)
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", refresh)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", refresh)
    }
  }, [today])
  return today
}

const useSeasonOverride = (): SeasonOverride | null => {
  const [override, setOverride] = useState<SeasonOverride | null>(null)
  useEffect(() => {
    const load = async () => setOverride(await loadSeasonOverride())
    void load()
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local" || !(SEASON_OVERRIDE_KEY in changes)) return
      const next: unknown = changes[SEASON_OVERRIDE_KEY].newValue
      setOverride(isSeasonOverride(next) ? next : null)
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])
  return override
}

export const SeasonProvider = ({ children }: { children: ReactNode }) => {
  const { state } = useExtensionState()
  const today = useToday()
  const override = useSeasonOverride()
  const seasonal = state.ready && state.settings.seasonalThemes !== false
  const season = resolveSeason({ enabled: seasonal, date: today, override })

  useEffect(() => {
    const root = document.documentElement
    for (const period of SEASON_PERIODS) root.classList.toggle(`season-${period.season}`, period.season === season)
  }, [season])

  const value = useMemo(() => ({ season, seasonal, today, override }), [season, seasonal, today, override])

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>
}

export const useSeason = (): SeasonValue => useContext(SeasonContext)
