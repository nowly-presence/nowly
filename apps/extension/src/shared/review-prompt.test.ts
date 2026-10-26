import { describe, expect, it } from "vitest";
import { isReviewPromptDue, isReviewPromptState, REVIEW_PROMPT_DELAY_MS } from "@/shared/review-prompt";

const now = Date.parse("2026-09-28T12:00:00.000Z");

describe("review-prompt", () => {
  it("determines review prompt eligibility based on delay, dismissal, and recorded visit", () => {
    // Unrecorded
    expect(isReviewPromptDue(null, now)).toBe(false);

    // Before delay elapsed
    expect(isReviewPromptDue({ firstSeenAt: now - REVIEW_PROMPT_DELAY_MS + 1 }, now)).toBe(false);

    // After delay elapsed
    expect(isReviewPromptDue({ firstSeenAt: now - REVIEW_PROMPT_DELAY_MS }, now)).toBe(true);

    // Once dismissed, never shows again
    expect(
      isReviewPromptDue(
        {
          firstSeenAt: 0,
          dismissedAt: now - 1
        },
        now
      )
    ).toBe(false);
  });

  it("validates runtime review prompt state schema", () => {
    expect(isReviewPromptState({ firstSeenAt: "yesterday" })).toBe(false);
    expect(isReviewPromptState(null)).toBe(false);
    expect(isReviewPromptState({ firstSeenAt: 1 })).toBe(true);
  });
});