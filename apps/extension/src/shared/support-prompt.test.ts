import { describe, expect, it } from "vitest"
import { REVIEW_PROMPT_DELAY_MS, type ReviewPromptState } from "@/shared/review-prompt"
import {
  isSupportPromptState,
  localDayKey,
  shouldShowSupportCard,
  SUPPORT_PROMPT_AFTER_REVIEW_MS,
  SUPPORT_PROMPT_MIN_USAGE_DAYS,
  withSnooze,
  withUsageDay,
  type SupportCardContext,
  type SupportPromptState,
} from "@/shared/support-prompt"

const DAY_MS = 24 * 60 * 60 * 1000
const now = new Date(2026, 9, 5, 12).getTime()
const seenReview: ReviewPromptState = { firstSeenAt: 0, dismissedAt: now - 60 * DAY_MS }

const context = (overrides: Partial<SupportCardContext> = {}): SupportCardContext => ({
  prompt: { usageDays: SUPPORT_PROMPT_MIN_USAGE_DAYS },
  review: seenReview,
  reviewEligible: true,
  live: false,
  onboarding: false,
  now,
  ...overrides,
})

describe("shouldShowSupportCard", () => {
  it("waits for 14 days of use", () => {
    expect(shouldShowSupportCard(context({ prompt: { usageDays: SUPPORT_PROMPT_MIN_USAGE_DAYS - 1 } }))).toBe(false)
    expect(shouldShowSupportCard(context({ prompt: { usageDays: SUPPORT_PROMPT_MIN_USAGE_DAYS } }))).toBe(true)
  })

  it("comes back 90 days after Later", () => {
    const prompt = withSnooze({ usageDays: 30 }, "later", now)
    expect(shouldShowSupportCard(context({ prompt, now: now + 89 * DAY_MS }))).toBe(false)
    expect(shouldShowSupportCard(context({ prompt, now: now + 90 * DAY_MS }))).toBe(true)
  })

  it("stays hidden for 180 days after Support", () => {
    const prompt = withSnooze({ usageDays: 30 }, "support", now)
    expect(shouldShowSupportCard(context({ prompt, now: now + 179 * DAY_MS }))).toBe(false)
    expect(shouldShowSupportCard(context({ prompt, now: now + 180 * DAY_MS }))).toBe(true)
  })

  it("never shows during an activity", () => {
    expect(shouldShowSupportCard(context({ live: true }))).toBe(false)
  })

  it("never shows during onboarding", () => {
    expect(shouldShowSupportCard(context({ onboarding: true }))).toBe(false)
  })

  it("leaves the turn to a pending review prompt", () => {
    const review: ReviewPromptState = { firstSeenAt: now - REVIEW_PROMPT_DELAY_MS }
    expect(shouldShowSupportCard(context({ review }))).toBe(false)
    expect(shouldShowSupportCard(context({ review, reviewEligible: false }))).toBe(true)
  })

  it("waits 14 days after the review prompt was answered", () => {
    const review = (age: number): ReviewPromptState => ({ firstSeenAt: 0, dismissedAt: now - age })
    expect(shouldShowSupportCard(context({ review: review(SUPPORT_PROMPT_AFTER_REVIEW_MS - 1) }))).toBe(false)
    expect(shouldShowSupportCard(context({ review: review(SUPPORT_PROMPT_AFTER_REVIEW_MS) }))).toBe(true)
  })

  it("does not wait for a review prompt that is not due yet", () => {
    expect(shouldShowSupportCard(context({ review: { firstSeenAt: now } }))).toBe(true)
    expect(shouldShowSupportCard(context({ review: null }))).toBe(true)
  })
})

describe("withUsageDay", () => {
  it("counts each local day once", () => {
    const first = withUsageDay({ usageDays: 0 }, now)
    expect(first).toEqual({ usageDays: 1, lastUsageDay: localDayKey(now) })
    expect(first && withUsageDay(first, now + 60_000)).toBeNull()
    const next = first && withUsageDay(first, now + DAY_MS)
    expect(next?.usageDays).toBe(2)
  })

  it("keeps the snooze date", () => {
    const state: SupportPromptState = { usageDays: 3, lastUsageDay: "2026-01-01", snoozedUntil: 42 }
    expect(withUsageDay(state, now)?.snoozedUntil).toBe(42)
  })
})

describe("isSupportPromptState", () => {
  it("rejects malformed values", () => {
    expect(isSupportPromptState(null)).toBe(false)
    expect(isSupportPromptState({ usageDays: "3" })).toBe(false)
    expect(isSupportPromptState({ usageDays: 3, snoozedUntil: "later" })).toBe(false)
    expect(isSupportPromptState({ usageDays: 3, lastUsageDay: "2026-10-05", snoozedUntil: 1 })).toBe(true)
  })
})
