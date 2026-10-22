import { describe, expect, it, vi } from "vitest";
import { readableBadgeColor, toolbarActivityColor, toolbarActivitySymbol } from "@/background/managers/toolbar-badge";
import { installChromeMock } from "@/test/chrome-mock";
import type { CurrentActivity, CustomActivitiesState, InstalledPresences } from "@/shared/types";

const current = (slug: string): CurrentActivity => ({
  slug,
  presence: {},
  updatedAt: 0
});

const stored = (color: string): InstalledPresences => ({
  reddit: {
    metadata: {
      slug: "reddit",
      name: "Reddit",
      author: { name: "Nowly" },
      description: {},
      url: [],
      category: "social",
      color
    },
    release: {
      slug: "reddit",
      version: "1",
      metadata: {} as never,
      bundle: "",
      sha256: "",
      metadataHash: "",
      signature: "",
      signedAt: ""
    },
    enabled: true,
    installedAt: 0
  }
});

describe("refreshToolbarBadge", () => {
  it("sets the emoji and presence color, shows pause, then clears the badge", async () => {
    const { local } = installChromeMock();
    const setBadgeText = vi.fn(async (_options: { text: string }) => {});
    const setBadgeBackgroundColor = vi.fn(async (_options: { color: string }) => {});
    Object.assign(chrome, {
      action: { setBadgeText, setBadgeBackgroundColor }
    });
    local.settings = { presencePaused: false };
    local.currentActivity = {
      ...current("reddit"),
      presence: { type: 3 }
    };
    local.presences = stored("#ff4500");
    local.customActivities = customs;

    const { refreshToolbarBadge } = await import("@/background/managers/activity-manager");
    await refreshToolbarBadge();
    expect(setBadgeBackgroundColor).toHaveBeenLastCalledWith({ color: "#cc3703" });
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: "👀" });

    local.settings = { presencePaused: true };
    await refreshToolbarBadge();
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: "II" });
    expect(setBadgeBackgroundColor).toHaveBeenLastCalledWith({ color: "#f59e0b" });

    local.settings = { presencePaused: false };
    local.currentActivity = null;
    await refreshToolbarBadge();
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: "" });
  });
});

const customs: CustomActivitiesState = {
  activeId: "one",
  activatedAt: 0,
  items: [
    {
      id: "one",
      name: "Reading",
      type: 0,
      details: "",
      state: "",
      largeText: "",
      smallText: "",
      largeImage: {
        kind: "icon",
        icon: "book",
        color: "#d45017"
      },
      smallImage: { kind: "none" },
      timestamp: { mode: "elapsed" },
      buttons: [],
      detectionUrl: "",
      createdAt: 0,
      updatedAt: 0
    }
  ]
};

describe("toolbarActivityColor", () => {
  it("blends 20% of #000010 into the opaque activity color", () => {
    expect(readableBadgeColor("#ff4500")).toBe("#cc3703");
    expect(readableBadgeColor("#f40")).toBe("#cc3603");
    expect(readableBadgeColor("#0891b2")).toBe("#067492");
  });
  it("uses the installed presence metadata color", () => {
    expect(toolbarActivityColor(current("reddit"), stored("#ff4500"), customs)).toBe("#ff4500");
  });

  it("uses the active custom activity's large icon color", () => {
    expect(toolbarActivityColor(current("custom:one"), {}, customs)).toBe("#d45017");
  });

  it("uses Nowly color for uploads and missing or invalid metadata", () => {
    const uploaded: CustomActivitiesState = {
      ...customs,
      items: [
        {
          ...customs.items[0],
          largeImage: {
            kind: "upload",
            hash: "hash",
            mime: "image/png",
            size: 1
          }
        }
      ]
    };
    expect(toolbarActivityColor(current("custom:one"), {}, uploaded)).toBe("#0891b2");
    expect(toolbarActivityColor(current("missing"), {}, customs)).toBe("#0891b2");
    expect(toolbarActivityColor(current("reddit"), stored("invalid"), customs)).toBe("#0891b2");
  });

  it("shows an emoji for the activity type and defaults to playing", () => {
    expect(toolbarActivitySymbol(0)).toBe("🎮");
    expect(toolbarActivitySymbol(2)).toBe("🎧");
    expect(toolbarActivitySymbol(3)).toBe("👀");
    expect(toolbarActivitySymbol(5)).toBe("🏆");
    expect(toolbarActivitySymbol(undefined)).toBe("🎮");
  });
});