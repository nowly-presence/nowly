import { describe, expect, it } from "vitest"
import { isPrankDay, isSeasonMomentDay, isSeasonOverride, msUntilNextDay, resolveSeason, SEASON_PERIODS, seasonForDate } from "@/shared/seasonal-themes"

const local = (year: number, month: number, day: number, hour = 12) => new Date(year, month - 1, day, hour)

describe("seasonForDate", () => {
  it("keeps the Halloween theme for October 2026 only", () => {
    expect(seasonForDate(local(2027, 10, 15))).toBeNull()
    expect(seasonForDate(local(2027, 10, 31))).toBeNull()
    expect(seasonForDate(local(2027, 9, 22))).toBe("autumn")
  })

  it("is Halloween for the whole of October 2026", () => {
    expect(seasonForDate(local(2026, 10, 1, 0))).toBe("halloween")
    expect(seasonForDate(local(2026, 10, 15))).toBe("halloween")
    expect(seasonForDate(local(2026, 10, 31, 23))).toBe("halloween")
  })

  it("shows each season for a week around its solstice or equinox", () => {
    expect(seasonForDate(local(2026, 3, 17, 0))).toBe("spring")
    expect(seasonForDate(local(2026, 3, 23, 23))).toBe("spring")
    expect(seasonForDate(local(2026, 6, 18, 0))).toBe("summer")
    expect(seasonForDate(local(2026, 6, 24, 23))).toBe("summer")
    expect(seasonForDate(local(2026, 9, 19, 0))).toBe("autumn")
    expect(seasonForDate(local(2026, 9, 25, 23))).toBe("autumn")
  })

  it("keeps winter through the end of year holidays", () => {
    expect(seasonForDate(local(2026, 12, 18, 0))).toBe("winter")
    expect(seasonForDate(local(2026, 12, 25))).toBe("winter")
    expect(seasonForDate(local(2026, 12, 26, 23))).toBe("winter")
  })

  it("leaves the rest of the year to the brand theme", () => {
    expect(seasonForDate(local(2026, 3, 16, 23))).toBeNull()
    expect(seasonForDate(local(2026, 3, 24, 0))).toBeNull()
    expect(seasonForDate(local(2026, 7, 14))).toBeNull()
    expect(seasonForDate(local(2026, 9, 30, 23))).toBeNull()
    expect(seasonForDate(local(2026, 11, 1, 0))).toBeNull()
    expect(seasonForDate(local(2026, 12, 27, 0))).toBeNull()
    expect(seasonForDate(local(2027, 2, 14))).toBeNull()
  })

  it("is the new year across midnight on December 31", () => {
    expect(seasonForDate(local(2026, 12, 30, 23))).toBeNull()
    expect(seasonForDate(local(2026, 12, 31, 0))).toBe("new-year")
    expect(seasonForDate(local(2027, 1, 1, 23))).toBe("new-year")
    expect(seasonForDate(local(2027, 1, 2, 0))).toBeNull()
  })

  it("skips a disabled period", () => {
    const withoutHalloween = SEASON_PERIODS.map((period) => (period.season === "halloween" ? { ...period, enabled: false } : period))
    expect(seasonForDate(local(2026, 10, 12), withoutHalloween)).toBeNull()
    const longAutumn = SEASON_PERIODS.map((period) => (period.season === "autumn" ? { ...period, to: { month: 10, day: 30 } } : period))
    expect(seasonForDate(local(2026, 10, 12), longAutumn)).toBe("halloween")
    expect(seasonForDate(local(2026, 11, 12), longAutumn)).toBe("autumn")
    expect(seasonForDate(local(2026, 10, 12), [])).toBeNull()
  })
})

describe("resolveSeason", () => {
  const october = local(2026, 10, 12)

  it("only applies when seasonal themes are on", () => {
    expect(resolveSeason({ enabled: true, date: october })).toBe("halloween")
    expect(resolveSeason({ enabled: false, date: october })).toBeNull()
  })

  it("lets an override force or silence the period", () => {
    expect(resolveSeason({ enabled: true, date: local(2026, 6, 1), override: "halloween" })).toBe("halloween")
    expect(resolveSeason({ enabled: true, date: october, override: "winter" })).toBe("winter")
    expect(resolveSeason({ enabled: true, date: october, override: "none" })).toBeNull()
    expect(resolveSeason({ enabled: false, date: october, override: "halloween" })).toBeNull()
  })
})

describe("moments", () => {
  it("keeps the Halloween prank on the 31st of October only, every year", () => {
    expect(isPrankDay(local(2026, 10, 31, 0))).toBe(true)
    expect(isPrankDay(local(2027, 10, 31, 12))).toBe(true)
    expect(isPrankDay(local(2026, 10, 30, 23))).toBe(false)
    expect(isPrankDay(local(2026, 11, 1, 0))).toBe(false)
  })

  it("puts the season moments on the equinoxes, solstices and January 1", () => {
    expect(isSeasonMomentDay("spring", local(2026, 3, 20))).toBe(true)
    expect(isSeasonMomentDay("summer", local(2026, 6, 21))).toBe(true)
    expect(isSeasonMomentDay("autumn", local(2026, 9, 22))).toBe(true)
    expect(isSeasonMomentDay("winter", local(2026, 12, 21))).toBe(true)
    expect(isSeasonMomentDay("new-year", local(2027, 1, 1))).toBe(true)
    expect(isSeasonMomentDay("new-year", local(2026, 12, 31))).toBe(false)
    expect(isSeasonMomentDay("spring", local(2026, 3, 21))).toBe(false)
  })
})

describe("msUntilNextDay", () => {
  it("counts down to local midnight", () => {
    expect(msUntilNextDay(local(2026, 10, 31, 23))).toBe(60 * 60 * 1000)
  })
})

describe("isSeasonOverride", () => {
  it("accepts known seasons and none", () => {
    expect(isSeasonOverride("halloween")).toBe(true)
    expect(isSeasonOverride("new-year")).toBe(true)
    expect(isSeasonOverride("spring")).toBe(true)
    expect(isSeasonOverride("none")).toBe(true)
    expect(isSeasonOverride("easter")).toBe(false)
  })
})
