import { describe, expect, it } from "vitest"
import { isPrankDay, isSeasonOverride, msUntilNextDay, resolveSeason, SEASON_PERIODS, seasonForDate } from "@/shared/seasonal-themes"

const local = (year: number, month: number, day: number, hour = 12) => new Date(year, month - 1, day, hour)

describe("seasonForDate", () => {
  it("is Halloween for the whole of October", () => {
    expect(seasonForDate(local(2026, 10, 1, 0))).toBe("halloween")
    expect(seasonForDate(local(2026, 10, 15))).toBe("halloween")
    expect(seasonForDate(local(2026, 10, 31, 23))).toBe("halloween")
  })

  it("is nothing just outside October", () => {
    expect(seasonForDate(local(2026, 9, 30, 23))).toBeNull()
    expect(seasonForDate(local(2026, 11, 1, 0))).toBeNull()
  })

  it("keeps winter prepared but off", () => {
    expect(seasonForDate(local(2026, 12, 20))).toBeNull()
    const withWinter = SEASON_PERIODS.map((period) => ({ ...period, enabled: true }))
    expect(seasonForDate(local(2026, 12, 20), withWinter)).toBe("winter")
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
    expect(resolveSeason({ enabled: true, date: october, override: "none" })).toBeNull()
    expect(resolveSeason({ enabled: false, date: october, override: "halloween" })).toBeNull()
  })
})

describe("isPrankDay", () => {
  it("is only the 31st of October", () => {
    expect(isPrankDay(local(2026, 10, 31, 0))).toBe(true)
    expect(isPrankDay(local(2026, 10, 30, 23))).toBe(false)
    expect(isPrankDay(local(2026, 11, 1, 0))).toBe(false)
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
    expect(isSeasonOverride("none")).toBe(true)
    expect(isSeasonOverride("easter")).toBe(false)
  })
})
