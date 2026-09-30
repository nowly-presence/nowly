import { describe, expect, it } from "vitest"
import { isHalloweenPrankDue, isHalloweenPrankState, markHalloweenPrankShown } from "@/shared/halloween-prank"

const halloween = new Date(2026, 9, 31, 9)
const regularDay = new Date(2026, 9, 12, 9)

describe("isHalloweenPrankDue", () => {
  it("fires on the 31st of October when not shown this year", () => {
    expect(isHalloweenPrankDue(null, halloween)).toBe(true)
    expect(isHalloweenPrankDue({ lastShownYear: 2025 }, halloween)).toBe(true)
  })

  it("fires only once a year", () => {
    expect(isHalloweenPrankDue({ lastShownYear: 2026 }, halloween)).toBe(false)
  })

  it("stays quiet on other days unless replayed", () => {
    expect(isHalloweenPrankDue(null, regularDay)).toBe(false)
    expect(isHalloweenPrankDue({ lastShownYear: 2026, replay: true }, regularDay)).toBe(true)
  })
})

describe("markHalloweenPrankShown", () => {
  it("records the year on the day itself", () => {
    expect(markHalloweenPrankShown({ replay: true }, halloween)).toEqual({ lastShownYear: 2026 })
  })

  it("keeps the previous year after a replay on another day", () => {
    expect(markHalloweenPrankShown({ lastShownYear: 2025, replay: true }, regularDay)).toEqual({ lastShownYear: 2025 })
    expect(markHalloweenPrankShown({ replay: true }, regularDay)).toEqual({})
  })
})

describe("isHalloweenPrankState", () => {
  it("rejects malformed values", () => {
    expect(isHalloweenPrankState({ lastShownYear: "2026" })).toBe(false)
    expect(isHalloweenPrankState(null)).toBe(false)
    expect(isHalloweenPrankState({})).toBe(true)
  })
})
