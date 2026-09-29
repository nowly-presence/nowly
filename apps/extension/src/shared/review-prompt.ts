export const REVIEW_PROMPT_KEY = "reviewPrompt"
export const REVIEW_PROMPT_DELAY_MS = 3 * 24 * 60 * 60 * 1000

export type ReviewPromptState = { firstSeenAt: number; dismissedAt?: number }

export const isReviewPromptState = (value: unknown): value is ReviewPromptState =>
  Boolean(value) && typeof value === "object" && typeof (value as ReviewPromptState).firstSeenAt === "number"

export const isReviewPromptDue = (state: ReviewPromptState | null, now: number): boolean =>
  Boolean(state && !state.dismissedAt && now - state.firstSeenAt >= REVIEW_PROMPT_DELAY_MS)

export const loadReviewPrompt = async (): Promise<ReviewPromptState | null> => {
  const result = await chrome.storage.local.get(REVIEW_PROMPT_KEY)
  return isReviewPromptState(result[REVIEW_PROMPT_KEY]) ? result[REVIEW_PROMPT_KEY] : null
}

export const saveReviewPrompt = (state: ReviewPromptState): Promise<void> => chrome.storage.local.set({ [REVIEW_PROMPT_KEY]: state })

export const dismissReviewPrompt = async (now = Date.now()): Promise<void> => {
  const current = await loadReviewPrompt()
  await saveReviewPrompt({ firstSeenAt: current?.firstSeenAt ?? now, dismissedAt: now })
}
