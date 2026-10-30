import { describe, expect, it } from "vitest";
import { isHalloweenPrankDue, isHalloweenPrankState, markHalloweenPrankShown } from "@/shared/halloween-prank";

const halloween = new Date(2026, 9, 31, 9);
const regularDay = new Date(2026, 9, 12, 9);

describe("halloween prank", () => {
  it("is due on October 31 once per year", () => {
    expect(isHalloweenPrankDue(null, halloween)).toBe(true);
    expect(isHalloweenPrankDue({ lastShownYear: 2025 }, halloween)).toBe(true);
    expect(isHalloweenPrankDue({ lastShownYear: 2026 }, halloween)).toBe(false);
  });

  it("stays quiet on other days unless a replay is requested", () => {
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
  });

  it("records the year only when shown on Halloween and always clears the replay flag", () => {
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
  });

  it("accepts only well-formed stored state", () => {
    expect(isHalloweenPrankState({})).toBe(true);
    expect(isHalloweenPrankState({ lastShownYear: 2026 })).toBe(true);
    expect(isHalloweenPrankState({ lastShownYear: "2026" })).toBe(false);
    expect(isHalloweenPrankState(null)).toBe(false);
  });
});