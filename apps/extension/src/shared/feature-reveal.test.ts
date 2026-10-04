import { describe, expect, it } from "vitest"
import { isRevealDue, isRevealVersionCurrent } from "@/shared/feature-reveal"

describe("isRevealVersionCurrent", () => {
  it("shows a reveal on its own minor release line only", () => {
    expect(isRevealVersionCurrent("2.3.0", "2.3.0")).toBe(true)
    expect(isRevealVersionCurrent("2.3.0", "2.3.4")).toBe(true)
    expect(isRevealVersionCurrent("2.3.0", "2.2.9")).toBe(false)
    expect(isRevealVersionCurrent("2.3.0", "2.4.0")).toBe(false)
    expect(isRevealVersionCurrent("2.3.2", "2.3.1")).toBe(false)
  })
})

describe("isRevealDue", () => {
  it("never comes back once seen", () => {
    expect(isRevealDue("custom-activity", "2.3.0", "2.3.0", {})).toBe(true)
    expect(isRevealDue("custom-activity", "2.3.0", "2.3.0", { "custom-activity": 1 })).toBe(false)
  })
})
