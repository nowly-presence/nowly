import { useCallback, useEffect, useState } from "react"
import { useSeason } from "@/hooks/season-provider"
import {
  isSeasonMomentDue,
  isSeasonMomentsState,
  loadSeasonMoments,
  markSeasonMomentShown,
  saveSeasonMoments,
  SEASON_MOMENTS_KEY,
  type MomentSeason,
  type SeasonMomentsState,
} from "@/shared/season-moments"

const SHOW_DELAY_MS = 700

export const useSeasonMoment = (eligible: boolean) => {
  const { season, today } = useSeason()
  const [stored, setStored] = useState<SeasonMomentsState | null | undefined>(undefined)
  const [shown, setShown] = useState<MomentSeason | null>(null)

  useEffect(() => {
    const load = async () => setStored(await loadSeasonMoments())
    void load()
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local" || !(SEASON_MOMENTS_KEY in changes)) return
      const next: unknown = changes[SEASON_MOMENTS_KEY].newValue
      setStored(isSeasonMomentsState(next) ? next : null)
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  const due = eligible && shown === null && stored !== undefined && isSeasonMomentDue(stored, season, today) ? season : null

  useEffect(() => {
    if (!due) return
    const timer = window.setTimeout(() => {
      setShown(due)
      void saveSeasonMoments(markSeasonMomentShown(stored ?? null, due, new Date()))
    }, SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [due, stored])

  const close = useCallback(() => setShown(null), [])

  return { season: shown, close }
}
