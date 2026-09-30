import { useCallback, useEffect, useState } from "react"
import { useSeason } from "@/hooks/season-provider"
import {
  HALLOWEEN_PRANK_KEY,
  isHalloweenPrankDue,
  isHalloweenPrankState,
  loadHalloweenPrank,
  markHalloweenPrankShown,
  saveHalloweenPrank,
  type HalloweenPrankState,
} from "@/shared/halloween-prank"

const SHOW_DELAY_MS = 700

export const useHalloweenPrank = (eligible: boolean) => {
  const { today } = useSeason()
  const [stored, setStored] = useState<HalloweenPrankState | null | undefined>(undefined)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const load = async () => setStored(await loadHalloweenPrank())
    void load()
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local" || !(HALLOWEEN_PRANK_KEY in changes)) return
      const next: unknown = changes[HALLOWEEN_PRANK_KEY].newValue
      setStored(isHalloweenPrankState(next) ? next : null)
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  const due = eligible && !open && stored !== undefined && isHalloweenPrankDue(stored, today)

  useEffect(() => {
    if (!due) return
    const timer = window.setTimeout(() => {
      setOpen(true)
      void saveHalloweenPrank(markHalloweenPrankShown(stored ?? null, new Date()))
    }, SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [due, stored])

  const close = useCallback(() => setOpen(false), [])

  return { open, close }
}
