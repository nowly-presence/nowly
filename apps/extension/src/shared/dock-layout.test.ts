import { describe, expect, it } from "vitest";
import { DOCK_TABS, isDefaultDockLayout, moveDockTab, normalizeDockLayout, restoreDockLayoutTabs, visibleDockTabs } from "@/shared/dock-layout";

const TABS = ["activity", "store", "custom", "settings"] as const;

type Tab = (typeof TABS)[number];

const base: Tab[][] = [["activity", "store", "custom", "settings"]];

describe("dock visibility", () => {
  it("uses the intended default tab order", () => {
    expect(DOCK_TABS).toEqual(["activity", "custom", "store", "announcements", "settings"]);
  });

  it("keeps required tabs visible even with invalid stored preferences", () => {
    expect(visibleDockTabs(["activity", "settings", "custom", "store", "announcements", "unknown"])).toEqual(["activity", "settings"]);
  });

  it("removes hidden tabs and empty groups without reordering visible tabs", () => {
    expect(
      normalizeDockLayout(
        [
          ["settings", "store"],
          ["custom"],
          ["activity"]
        ],
        visibleDockTabs(["custom", "store", "announcements"])
      )
    ).toEqual([
      ["settings"],
      ["activity"]
    ]);
  });

  it("restores every tab in its original order with an explicit reset layout", () => {
    expect(normalizeDockLayout([[...DOCK_TABS]], visibleDockTabs([]))).toEqual([[...DOCK_TABS]]);
    expect(
      isDefaultDockLayout(
        [
          ["settings"],
          ["activity", "store", "custom"]
        ],
        DOCK_TABS
      )
    ).toBe(false);
  });
});

describe("normalizeDockLayout", () => {
  it("falls back to one bar with every tab", () => {
    expect(normalizeDockLayout(undefined, TABS)).toEqual(base);
    expect(isDefaultDockLayout(normalizeDockLayout(null, TABS), TABS)).toBe(true);
  });

  it("drops unknown, duplicated and empty entries and appends missing tabs", () => {
    expect(
      normalizeDockLayout(
        [
          ["store", "nope", "store"],
          [],
          ["activity"]
        ],
        TABS
      )
    ).toEqual([
      ["store"],
      ["activity", "custom", "settings"]
    ]);
  });
});

describe("moveDockTab", () => {
  it("reorders inside a bar, creates new bars, merges bars and caps maximum split count", () => {
    expect(
      moveDockTab(base, "settings", {
        kind: "into",
        group: 0,
        index: 0
      })
    ).toEqual([["settings", "activity", "store", "custom"]]);

    expect(
      moveDockTab(base, "activity", {
        kind: "new",
        side: "end"
      })
    ).toEqual([
      ["store", "custom", "settings"],
      ["activity"]
    ]);
    expect(
      moveDockTab(base, "settings", {
        kind: "new",
        side: "start"
      })
    ).toEqual([
      ["settings"],
      ["activity", "store", "custom"]
    ]);

    const split: Tab[][] = [
      ["store", "custom", "settings"],
      ["activity"]
    ];
    expect(
      moveDockTab(split, "store", {
        kind: "into",
        group: 1,
        index: 1
      })
    ).toEqual([
      ["custom", "settings"],
      ["activity", "store"]
    ]);
    expect(
      moveDockTab(split, "activity", {
        kind: "into",
        group: 0,
        index: 0
      })
    ).toEqual([["activity", "store", "custom", "settings"]]);

    const maxSplit: Tab[][] = [
      ["activity"],
      ["store", "custom"],
      ["settings"]
    ];
    expect(
      moveDockTab(maxSplit, "activity", {
        kind: "new",
        side: "start"
      })
    ).toEqual(maxSplit);
    expect(
      moveDockTab(maxSplit, "store", {
        kind: "new",
        side: "end"
      })
    ).toEqual([
      ["activity"],
      ["custom"],
      ["settings", "store"]
    ]);
    expect(
      moveDockTab(
        [
          ["activity", "store", "custom"],
          ["settings"]
        ],
        "store",
        {
          kind: "new",
          side: "start"
        }
      )
    ).toEqual([
      ["store"],
      ["activity", "custom"],
      ["settings"]
    ]);
  });
});

describe("restoreDockLayoutTabs", () => {
  it("restores hidden tabs at their previous position in the saved order", () => {
    expect(restoreDockLayoutTabs([["activity", "store", "announcements", "settings"]], DOCK_TABS)).toEqual([
      ["activity", "custom", "store", "announcements", "settings"]
    ]);
  });

  it("keeps a restored tab with its nearest following navigation tab", () => {
    expect(
      restoreDockLayoutTabs(
        [
          ["activity"],
          ["store", "announcements", "settings"]
        ],
        DOCK_TABS
      )
    ).toEqual([
      ["activity"],
      ["custom", "store", "announcements", "settings"]
    ]);
  });
});