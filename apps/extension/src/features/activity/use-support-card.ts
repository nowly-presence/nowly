import { useCallback, useEffect, useState } from "react"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useFeatureReveals } from "@/hooks/feature-reveal-provider"
import { sendMessage } from "@/lib/messages"
import { isReviewPromptState, loadReviewPrompt, REVIEW_PROMPT_KEY, type ReviewPromptState } from "@/shared/review-prompt"
import {
  isSupportPromptState,
  loadSupportPrompt,
  shouldShowSupportCard,
  SUPPORT_PROMPT_KEY,
  withSnooze,
  type SupportPromptAction,
  type SupportPromptState,
} from "@/shared/support-prompt"

export const useSupportCard = () => {
  const { state } = useExtensionState()
  const { activeId } = useFeatureReveals()
  const [prompt, setPrompt] = useState<SupportPromptState | undefined>(undefined)
  const [review, setReview] = useState<ReviewPromptState | null | undefined>(undefined)

  useEffect(() => {
    void loadSupportPrompt().then(setPrompt)
    void loadReviewPrompt().then(setReview)
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local") return
      if (SUPPORT_PROMPT_KEY in changes) {
        const next: unknown = changes[SUPPORT_PROMPT_KEY].newValue
        if (isSupportPromptState(next)) setPrompt(next)
      }
      if (REVIEW_PROMPT_KEY in changes) {
        const next: unknown = changes[REVIEW_PROMPT_KEY].newValue
        setReview(isReviewPromptState(next) ? next : null)
      }
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  const visible =
    state.ready &&
    prompt !== undefined &&
    review !== undefined &&
    activeId === null &&
    shouldShowSupportCard({
      prompt,
      review,
      reviewEligible: Object.keys(state.presences).length > 0,
      live: Boolean(state.activity) && !state.settings.presencePaused,
      onboarding: !state.onboarding.onboardingCompleted || state.onboarding.devReplayOnboarding,
      now: Date.now(),
    })

  const snooze = useCallback((action: SupportPromptAction) => {
    setPrompt((current) => (current ? withSnooze(current, action, Date.now()) : current))
    void sendMessage("SNOOZE_SUPPORT_PROMPT", { action }).catch(() => {})
  }, [])

  return { visible, snooze }
}
