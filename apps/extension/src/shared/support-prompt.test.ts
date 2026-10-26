import { describe, expect, it } from "vitest";
import { REVIEW_PROMPT_DELAY_MS, type ReviewPromptState } from "@/shared/review-prompt";
import { isSupportPromptState, localDayKey, shouldShowSupportCard, SUPPORT_PROMPT_AFTER_REVIEW_MS, SUPPORT_PROMPT_MIN_USAGE_DAYS, withSnooze, withUsageDay, type SupportCardContext } from "@/shared/support-prompt";

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date(2026, 9, 5, 12).getTime();
const seenReview: ReviewPromptState = {
  firstSeenAt: 0,
  dismissedAt: now - 60 * DAY_MS
};

const context = (overrides: Partial<SupportCardContext> = {}): SupportCardContext => ({
  prompt: { usageDays: SUPPORT_PROMPT_MIN_USAGE_DAYS },
  review: seenReview,
  reviewEligible: true,
  live: false,
  onboarding: false,
  now,
  ...overrides
});

describe("support-prompt", () => {
  it("governs display rules (min usage, snoozes, active states, review prompt precedence)", () => {
    // Requires minimum usage days
    expect(
      shouldShowSupportCard(
        context({
          prompt: { usageDays: SUPPORT_PROMPT_MIN_USAGE_DAYS - 1 }
        })
      )
    ).toBe(false);
    expect(
      shouldShowSupportCard(
        context({
          prompt: { usageDays: SUPPORT_PROMPT_MIN_USAGE_DAYS }
        })
      )
    ).toBe(true);

    // Snooze: 90 days after "later", 180 days after "support"
    const laterPrompt = withSnooze({ usageDays: 30 }, "later", now);
    expect(
      shouldShowSupportCard(
        context({
          prompt: laterPrompt,
          now: now + 89 * DAY_MS
        })
      )
    ).toBe(false);
    expect(
      shouldShowSupportCard(
        context({
          prompt: laterPrompt,
          now: now + 90 * DAY_MS
        })
      )
    ).toBe(true);

    const supportPrompt = withSnooze({ usageDays: 30 }, "support", now);
    expect(
      shouldShowSupportCard(
        context({
          prompt: supportPrompt,
          now: now + 179 * DAY_MS
        })
      )
    ).toBe(false);
    expect(
      shouldShowSupportCard(
        context({
          prompt: supportPrompt,
          now: now + 180 * DAY_MS
        })
      )
    ).toBe(true);

    // Suppressed during live activity or onboarding
    expect(shouldShowSupportCard(context({ live: true }))).toBe(false);
    expect(shouldShowSupportCard(context({ onboarding: true }))).toBe(false);

    // Precedence with review prompt
    const reviewPending: ReviewPromptState = { firstSeenAt: now - REVIEW_PROMPT_DELAY_MS };
    expect(shouldShowSupportCard(context({ review: reviewPending }))).toBe(false);
    expect(
      shouldShowSupportCard(
        context({
          review: reviewPending,
          reviewEligible: false
        })
      )
    ).toBe(true);

    // Waits 14 days after review prompt dismissal
    const dismissedRecent = {
      firstSeenAt: 0,
      dismissedAt: now - (SUPPORT_PROMPT_AFTER_REVIEW_MS - 1)
    };
    const dismissedElapsed = {
      firstSeenAt: 0,
      dismissedAt: now - SUPPORT_PROMPT_AFTER_REVIEW_MS
    };
    expect(shouldShowSupportCard(context({ review: dismissedRecent }))).toBe(false);
    expect(shouldShowSupportCard(context({ review: dismissedElapsed }))).toBe(true);
  });

  it("handles usage day tracking and state validation", () => {
    const first = withUsageDay({ usageDays: 0 }, now);
    expect(first).toEqual({
      usageDays: 1,
      lastUsageDay: localDayKey(now)
    });
    // Same day returns null (no double counting)
    expect(first && withUsageDay(first, now + 60_000)).toBeNull();

    // Next day increments usageDays and preserves snooze
    const next =
      first &&
      withUsageDay(
        {
          ...first,
          snoozedUntil: 42
        },
        now + DAY_MS
      );
    expect(next?.usageDays).toBe(2);
    expect(next?.snoozedUntil).toBe(42);

    // Schema validation
    expect(isSupportPromptState(null)).toBe(false);
    expect(isSupportPromptState({ usageDays: "two" })).toBe(false);
    expect(isSupportPromptState({ usageDays: 3 })).toBe(true);
  });
});