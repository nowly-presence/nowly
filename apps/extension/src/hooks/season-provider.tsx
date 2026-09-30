import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { isSeasonOverride, loadSeasonOverride, msUntilNextDay, resolveSeason, SEASON_OVERRIDE_KEY, SEASON_PERIODS, type Season, type SeasonOverride } from "@/shared/seasonal-themes"

type SeasonValue = { season: Season | null; seasonal: boolean; today: Date; override: SeasonOverride | null }

const SeasonContext = createContext<SeasonValue>({ season: null, seasonal: false, today: new Date(), override: null })

const MIDNIGHT_MARGIN_MS = 1000

const useToday = (): Date => {
  const [today, setToday] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setTimeout(() => setToday(new Date()), msUntilNextDay(today) + MIDNIGHT_MARGIN_MS)
    return () => window.clearTimeout(timer)
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
  const appearance = state.ready ? state.settings.appearance : undefined
  const season = resolveSeason({ appearance, date: today, override })

  useEffect(() => {
    const root = document.documentElement
    for (const period of SEASON_PERIODS) root.classList.toggle(`season-${period.season}`, period.season === season)
  }, [season])

  const value = useMemo(() => ({ season, seasonal: appearance === "seasonal", today, override }), [season, appearance, today, override])

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>
}

export const useSeason = (): SeasonValue => useContext(SeasonContext)
