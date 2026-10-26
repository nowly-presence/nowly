import { describe, expect, it } from "vitest";
import type { PresenceView } from "@/lib/presence-view";
import { filterCatalog, newPresenceSlugs, normalizeSearch, trendingPresences } from "@/features/library/library-catalog";

const view = (slug: string, overrides: Partial<PresenceView> = {}): PresenceView => ({
  slug,
  name: slug,
  description: "",
  longDescription: "",
  features: [],
  category: "other",
  color: "#000000",
  contributors: [],
  urls: [`${slug}.com`],
  addedAt: null,
  lastUpdated: null,
  ...overrides
});

const catalog = [
  view("youtube", {
    name: "YouTube",
    category: "video",
    activeUsers: 50,
    totalInstalls: 100,
    addedAt: "2026-01-01T00:00:00.000Z"
  }),
  view("deezer", {
    name: "Deezer",
    category: "music",
    activeUsers: 5,
    totalInstalls: 900,
    addedAt: "2026-06-01T00:00:00.000Z"
  }),
  view("ade", {
    name: "Adé Crème",
    category: "music",
    addedAt: null
  })
];

describe("filterCatalog", () => {
  it("filters and sorts catalog presences accurately", () => {
    // 1. Filter by category
    expect(
      filterCatalog(catalog, {
        category: "music",
        query: "",
        sort: "name",
        locale: "en"
      }).map((item) => item.slug)
    ).toEqual(["ade", "deezer"]);

    // 2. Matches accent-insensitive queries on name and urls
    expect(
      filterCatalog(catalog, {
        category: "all",
        query: "creme",
        sort: "name",
        locale: "en"
      }).map((item) => item.slug)
    ).toEqual(["ade"]);
    expect(
      filterCatalog(catalog, {
        category: "all",
        query: "youtube.com",
        sort: "name",
        locale: "en"
      }).map((item) => item.slug)
    ).toEqual(["youtube"]);

    // 3. Sorts by popularity (weighting active users over installs) and newest first
    expect(
      filterCatalog(catalog, {
        category: "all",
        query: "",
        sort: "popular",
        locale: "en"
      }).map((item) => item.slug)
    ).toEqual(["deezer", "youtube", "ade"]);

    expect(
      filterCatalog(catalog, {
        category: "all",
        query: "",
        sort: "new",
        locale: "en"
      }).map((item) => item.slug)
    ).toEqual(["deezer", "youtube", "ade"]);
  });
});

describe("catalog helpers", () => {
  it("normalizes search text and filters trending presences", () => {
    expect(normalizeSearch("Adé CRÈME")).toBe("ade creme");
    expect(trendingPresences(catalog).map((item) => item.slug)).toEqual(["youtube", "deezer"]);
  });
});

describe("newPresenceSlugs", () => {
  const now = Date.parse("2026-09-28T12:00:00.000Z");
  const batch = Array.from({ length: 24 }, (_, index) => view(`batch-${index}`, { addedAt: "2026-09-17T10:00:00.000Z" }));

  it("determines new presences respecting batch caps, calendar windows, and unknown dates", () => {
    const views = [
      view("nowly", { addedAt: "2026-09-27T09:00:00.000Z" }),
      view("product-hunt", { addedAt: "2026-09-27T10:00:00.000Z" }),
      ...batch
    ];
    expect([...newPresenceSlugs(views, now)].sort()).toEqual(["nowly", "product-hunt"]);

    const daysUnderLimit = [
      view("a", { addedAt: "2026-09-27T09:00:00.000Z" }),
      view("b", { addedAt: "2026-09-25T09:00:00.000Z" }),
      view("c", { addedAt: "2026-09-25T11:00:00.000Z" }),
      view("d", { addedAt: "2026-09-20T09:00:00.000Z" })
    ];
    expect([...newPresenceSlugs(daysUnderLimit, now)].sort()).toEqual(["a", "b", "c", "d"]);

    const expiredOrUndated = [
      view("old", { addedAt: "2026-09-01T00:00:00.000Z" }),
      view("unknown", { addedAt: null })
    ];
    expect(newPresenceSlugs(expiredOrUndated, now).size).toBe(0);
    expect(newPresenceSlugs(batch, now).size).toBe(0);
  });
});