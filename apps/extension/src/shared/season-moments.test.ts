import { describe, expect, it } from "vitest";
import { isSeasonMomentDue, isSeasonMomentsState, markSeasonMomentShown } from "@/shared/season-moments";

const local = (year: number, month: number, day: number, hour = 12) => new Date(year, month - 1, day, hour);

describe("season-moments", () => {
  it("determines when moments are due, handles replays, and validates state", () => {
    // 1. Due dates and yearly frequency
    expect(isSeasonMomentDue(null, "spring", local(2027, 3, 20))).toBe(true);
    expect(
      isSeasonMomentDue(
        {
          shown: { spring: 2027 }
        },
        "spring",
        local(2027, 3, 20)
      )
    ).toBe(false);
    expect(
      isSeasonMomentDue(
        {
          shown: { spring: 2026 }
        },
        "spring",
        local(2027, 3, 20)
      )
    ).toBe(true);
    expect(isSeasonMomentDue(null, "spring", local(2027, 3, 21))).toBe(false);
    expect(isSeasonMomentDue(null, "new-year", local(2027, 1, 1))).toBe(true);

    // 2. Halloween and replay rules
    expect(isSeasonMomentDue(null, "halloween", local(2026, 10, 31))).toBe(false);
    expect(isSeasonMomentDue({ replay: true }, "halloween", local(2026, 10, 31))).toBe(false);
    expect(isSeasonMomentDue({ replay: true }, null, local(2026, 3, 20))).toBe(false);
    expect(isSeasonMomentDue({ replay: true }, "winter", local(2026, 7, 4))).toBe(true);

    // 3. Mark as shown
    expect(
      markSeasonMomentShown(
        {
          shown: { winter: 2025 },
          replay: true
        },
        "spring",
        local(2026, 3, 20)
      )
    ).toEqual({
      shown: {
        winter: 2025,
        spring: 2026
      }
    });
    expect(
      markSeasonMomentShown(
        {
          shown: { spring: 2025 },
          replay: true
        },
        "spring",
        local(2026, 7, 4)
      )
    ).toEqual({
      shown: { spring: 2025 }
    });

    // 4. State schema validation
    expect(isSeasonMomentsState({})).toBe(true);
    expect(
      isSeasonMomentsState({
        shown: { spring: 2026 },
        replay: true
      })
    ).toBe(true);
    expect(
      isSeasonMomentsState({
        shown: { easter: 2026 }
      })
    ).toBe(false);
    expect(
      isSeasonMomentsState({
        shown: { spring: "2026" }
      })
    ).toBe(false);
    expect(isSeasonMomentsState({ replay: "yes" })).toBe(false);
    expect(isSeasonMomentsState(null)).toBe(false);
  });
});