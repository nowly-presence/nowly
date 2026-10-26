import { describe, expect, it } from "vitest";
import { isHalloweenPrankDue, isHalloweenPrankState, markHalloweenPrankShown } from "@/shared/halloween-prank";

const halloween = new Date(2026, 9, 31, 9);
const regularDay = new Date(2026, 9, 12, 9);

describe("halloween-prank", () => {
  it("triggers once a year on Halloween, supports replay, records state, and validates schema", () => {
    // 1. Triggers on Oct 31st once per year
    expect(isHalloweenPrankDue(null, halloween)).toBe(true);
    expect(isHalloweenPrankDue({ lastShownYear: 2025 }, halloween)).toBe(true);
    expect(isHalloweenPrankDue({ lastShownYear: 2026 }, halloween)).toBe(false);

    // 2. Quiet on normal days unless replay flag is set
    expect(isHalloweenPrankDue(null, regularDay)).toBe(false);
    expect(
      isHalloweenPrankDue(
        {
          lastShownYear: 2026,
          replay: true
        },
        regularDay
      )
    ).toBe(true);

    // 3. Records year on the day, drops replay flag
    expect(markHalloweenPrankShown({ replay: true }, halloween)).toEqual({ lastShownYear: 2026 });
    expect(
      markHalloweenPrankShown(
        {
          lastShownYear: 2025,
          replay: true
        },
        regularDay
      )
    ).toEqual({ lastShownYear: 2025 });
    expect(markHalloweenPrankShown({ replay: true }, regularDay)).toEqual({});

    // 4. Schema validation
    expect(isHalloweenPrankState({})).toBe(true);
    expect(isHalloweenPrankState({ lastShownYear: 2026 })).toBe(true);
    expect(isHalloweenPrankState({ lastShownYear: "2026" })).toBe(false);
    expect(isHalloweenPrankState(null)).toBe(false);
  });
});