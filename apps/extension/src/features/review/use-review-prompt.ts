import { useCallback, useEffect, useState } from "react"
import { dismissReviewPrompt, isReviewPromptDue, isReviewPromptState, loadReviewPrompt, REVIEW_PROMPT_KEY, saveReviewPrompt, type ReviewPromptState } from "@/shared/review-prompt"

const SHOW_DELAY_MS = 1500

export const useReviewPrompt = (eligible: boolean) => {
  const [stored, setStored] = useState<ReviewPromptState | null | undefined>(undefined)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    void loadReviewPrompt().then(setStored)
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local" || !(REVIEW_PROMPT_KEY in changes)) return
      const next = changes[REVIEW_PROMPT_KEY].newValue
      setStored(isReviewPromptState(next) ? next : null)
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  useEffect(() => {
    if (stored === null) void saveReviewPrompt({ firstSeenAt: Date.now() })
  }, [stored])

  const due = eligible && stored !== undefined && isReviewPromptDue(stored, Date.now())

  useEffect(() => {
    if (!due) return setSettled(false)
    const timer = window.setTimeout(() => setSettled(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [due])

  const dismiss = useCallback(() => void dismissReviewPrompt(), [])

  return { open: due && settled, dismiss }
}
