import { isReviewPromptDue, type ReviewPromptState } from "@/shared/review-prompt"

const DAY_MS = 24 * 60 * 60 * 1000

export const SUPPORT_PROMPT_KEY = "supportPrompt"
export const SUPPORT_PROMPT_MIN_USAGE_DAYS = 14
export const SUPPORT_PROMPT_LATER_MS = 90 * DAY_MS
export const SUPPORT_PROMPT_SUPPORTED_MS = 180 * DAY_MS
export const SUPPORT_PROMPT_AFTER_REVIEW_MS = 14 * DAY_MS

export type SupportPromptAction = "later" | "support"

export type SupportPromptState = { usageDays: number; lastUsageDay?: string; snoozedUntil?: number }

export type SupportCardContext = {
  prompt: SupportPromptState
  review: ReviewPromptState | null
  reviewEligible: boolean
  live: boolean
  onboarding: boolean
  now: number
}

export const DEFAULT_SUPPORT_PROMPT: SupportPromptState = { usageDays: 0 }

export const isSupportPromptState = (value: unknown): value is SupportPromptState => {
  if (!value || typeof value !== "object") return false
  const state = value as Partial<SupportPromptState>
  return (
    typeof state.usageDays === "number" &&
    (state.lastUsageDay === undefined || typeof state.lastUsageDay === "string") &&
    (state.snoozedUntil === undefined || typeof state.snoozedUntil === "number")
  )
}

const pad = (value: number) => String(value).padStart(2, "0")

export const localDayKey = (now: number): string => {
  const date = new Date(now)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const withUsageDay = (state: SupportPromptState, now: number): SupportPromptState | null => {
  const day = localDayKey(now)
  return state.lastUsageDay === day ? null : { ...state, usageDays: state.usageDays + 1, lastUsageDay: day }
}

export const withSnooze = (state: SupportPromptState, action: SupportPromptAction, now: number): SupportPromptState => ({
  ...state,
  snoozedUntil: now + (action === "support" ? SUPPORT_PROMPT_SUPPORTED_MS : SUPPORT_PROMPT_LATER_MS),
})

export const shouldShowSupportCard = ({ prompt, review, reviewEligible, live, onboarding, now }: SupportCardContext): boolean => {
  if (onboarding || live) return false
  if (prompt.usageDays < SUPPORT_PROMPT_MIN_USAGE_DAYS) return false
  if (prompt.snoozedUntil !== undefined && now < prompt.snoozedUntil) return false
  if (reviewEligible && isReviewPromptDue(review, now)) return false
  if (review?.dismissedAt !== undefined && now - review.dismissedAt < SUPPORT_PROMPT_AFTER_REVIEW_MS) return false
  return true
}

export const loadSupportPrompt = async (): Promise<SupportPromptState> => {
  const result = await chrome.storage.local.get(SUPPORT_PROMPT_KEY)
  const value: unknown = result[SUPPORT_PROMPT_KEY]
  return isSupportPromptState(value) ? value : DEFAULT_SUPPORT_PROMPT
}
