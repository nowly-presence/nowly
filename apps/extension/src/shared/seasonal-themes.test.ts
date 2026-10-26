import { describe, expect, it } from "vitest";
import { isPrankDay, isSeasonMomentDay, isSeasonOverride, msUntilNextDay, resolveSeason, SEASON_PERIODS, seasonForDate } from "@/shared/seasonal-themes";

const local = (year: number, month: number, day: number, hour = 12) => new Date(year, month - 1, day, hour);

describe("seasonal-themes", () => {
  it("resolves season according to dates, periods, and disabled status", () => {
    // Halloween 2026
    expect(seasonForDate(local(2026, 10, 15))).toBe("halloween");
    expect(seasonForDate(local(2027, 10, 15))).toBeNull();

    // Solstices & equinoxes
    expect(seasonForDate(local(2026, 3, 20))).toBe("spring");
    expect(seasonForDate(local(2026, 6, 21))).toBe("summer");
    expect(seasonForDate(local(2026, 9, 22))).toBe("autumn");
    expect(seasonForDate(local(2026, 12, 25))).toBe("winter");
    expect(seasonForDate(local(2026, 12, 31))).toBe("new-year");
    expect(seasonForDate(local(2027, 1, 1))).toBe("new-year");

    // Brand theme fallback
    expect(seasonForDate(local(2026, 7, 14))).toBeNull();

    // Period disabling
    const withoutHalloween = SEASON_PERIODS.map((period) => (period.season === "halloween" ? { ...period, enabled: false } : period));
    expect(seasonForDate(local(2026, 10, 12), withoutHalloween)).toBeNull();
  });

  it("handles settings toggle and overrides", () => {
    const october = local(2026, 10, 12);
    expect(
      resolveSeason({
        enabled: true,
        date: october
      })
    ).toBe("halloween");
    expect(
      resolveSeason({
        enabled: false,
        date: october
      })
    ).toBeNull();
    expect(
      resolveSeason({
        enabled: true,
        date: local(2026, 6, 1),
        override: "halloween"
      })
    ).toBe("halloween");
    expect(
      resolveSeason({
        enabled: true,
        date: october,
        override: "none"
      })
    ).toBeNull();
    expect(
      resolveSeason({
        enabled: false,
        date: october,
        override: "halloween"
      })
    ).toBeNull();

    expect(isSeasonOverride("halloween")).toBe(true);
    expect(isSeasonOverride("none")).toBe(true);
    expect(isSeasonOverride("invalid")).toBe(false);
  });

  it("checks special moments (prank day, moments, midnight countdown)", () => {
    expect(isPrankDay(local(2026, 10, 31, 0))).toBe(true);
    expect(isPrankDay(local(2026, 10, 30, 23))).toBe(false);

    expect(isSeasonMomentDay("spring", local(2026, 3, 20))).toBe(true);
    expect(isSeasonMomentDay("new-year", local(2027, 1, 1))).toBe(true);
    expect(isSeasonMomentDay("spring", local(2026, 3, 21))).toBe(false);

    expect(msUntilNextDay(local(2026, 10, 31, 23))).toBe(60 * 60 * 1000);
  });
});