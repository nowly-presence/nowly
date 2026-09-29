import { describe, expect, it } from "vitest"
import { isReviewPromptDue, isReviewPromptState, REVIEW_PROMPT_DELAY_MS } from "@/shared/review-prompt"

const now = Date.parse("2026-09-28T12:00:00.000Z")

describe("isReviewPromptDue", () => {
  it("waits until the delay after the first visit", () => {
    expect(isReviewPromptDue({ firstSeenAt: now - REVIEW_PROMPT_DELAY_MS + 1 }, now)).toBe(false)
    expect(isReviewPromptDue({ firstSeenAt: now - REVIEW_PROMPT_DELAY_MS }, now)).toBe(true)
  })

  it("never shows again once dismissed", () => {
    expect(isReviewPromptDue({ firstSeenAt: 0, dismissedAt: now - 1 }, now)).toBe(false)
  })

  it("does not show before the first visit is recorded", () => {
    expect(isReviewPromptDue(null, now)).toBe(false)
  })
})

describe("isReviewPromptState", () => {
  it("rejects malformed values", () => {
    expect(isReviewPromptState({ firstSeenAt: "yesterday" })).toBe(false)
    expect(isReviewPromptState(null)).toBe(false)
    expect(isReviewPromptState({ firstSeenAt: 1 })).toBe(true)
  })
})
