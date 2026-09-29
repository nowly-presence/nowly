import { describe, expect, it } from "vitest"
import { normalizeCatalog, normalizeCatalogItem } from "@/shared/presence-catalog"
import { publicationDates, wasUpdatedAfterPublication } from "@/shared/presence-dates"

describe("normalizeCatalogItem", () => {
  it("keeps ISO publication dates from the API", () => {
    const item = normalizeCatalogItem({ slug: "youtube", version: "1.2.0", addedAt: "2026-06-09T08:04:33.097Z", lastUpdated: "2026-09-17T18:49:01.000Z" })
    expect(item).toMatchObject({ slug: "youtube", addedAt: "2026-06-09T08:04:33.097Z", lastUpdated: "2026-09-17T18:49:01.000Z" })
  })

  it("turns missing or invalid dates into null", () => {
    expect(normalizeCatalogItem({ slug: "youtube" })).toMatchObject({ addedAt: null, lastUpdated: null })
    expect(normalizeCatalogItem({ slug: "youtube", addedAt: "not a date", lastUpdated: 42 })).toMatchObject({ addedAt: null, lastUpdated: null })
  })

  it("rejects entries without a slug", () => {
    expect(normalizeCatalogItem({ name: "No slug" })).toBeNull()
    expect(normalizeCatalogItem(null)).toBeNull()
  })
})

describe("normalizeCatalog", () => {
  it("drops invalid entries and rejects non-array payloads", () => {
    expect(normalizeCatalog([{ slug: "a" }, { nope: true }, "x"]).map((item) => item.slug)).toEqual(["a"])
    expect(() => normalizeCatalog({ items: [] })).toThrow("INVALID_CATALOG")
  })
})

describe("publication dates", () => {
  it("detects a republication after the first release", () => {
    expect(wasUpdatedAfterPublication(publicationDates({ addedAt: "2026-06-09T08:04:33.097Z", lastUpdated: "2026-09-17T18:49:01.000Z" }))).toBe(true)
    expect(wasUpdatedAfterPublication(publicationDates({ addedAt: "2026-06-09T08:04:33.097Z", lastUpdated: "2026-06-09T08:04:33.097Z" }))).toBe(false)
    expect(wasUpdatedAfterPublication(publicationDates({ addedAt: null, lastUpdated: "2026-06-09T08:04:33.097Z" }))).toBe(false)
  })
})
