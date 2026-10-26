import { beforeEach, describe, expect, it } from "vitest";
import { clearTabPresences, setFocusedTabId, upsertTabPresence } from "@/background/services/background-context";
import { installChromeMock } from "@/test/chrome-mock";
import type { ExtensionSettings, PresenceData, StoredPresence } from "@/shared/types";

describe("status display type", () => {
  it("preserves supported status display types (0, 1, 2) and omits unsupported/invalid values", async () => {
    installChromeMock();
    const { normalizeActivity } = await import("@/background/managers/activity-manager");

    const { mapPresenceData } = await import("@/background/services/native");

    for (const statusDisplayType of [0, 1, 2]) {
      const input = JSON.parse(
        JSON.stringify({
          details: "Video title",
          state: "Channel",
          statusDisplayType
        })
      ) as PresenceData;
      const payload = mapPresenceData(normalizeActivity(input, "YouTube"));
      expect(payload).toMatchObject({
        name: "YouTube",
        details: "Video title",
        state: "Channel",
        statusDisplayType
      });
    }

    for (const statusDisplayType of [undefined, null, -1, 3, 1.5, "2"]) {
      const input = JSON.parse(JSON.stringify({ statusDisplayType })) as PresenceData;
      expect(JSON.parse(JSON.stringify(mapPresenceData(normalizeActivity(input, "YouTube"))))).not.toHaveProperty("statusDisplayType");
    }
  });
});

const presence = (slug: string, updatedAt: number) => ({
  slug,
  presence: { name: slug },
  updatedAt
});

const baseSettings: ExtensionSettings = {
  presenceDisplayMode: "category",
  showPlayer: true,
  scheduleEnabled: false,
  activitySelectionMode: "focused",
  activityPriorityOrder: []
};

describe("pickBroadcastEntry", () => {
  beforeEach(async () => {
    installChromeMock();
    await clearTabPresences();
    setFocusedTabId(null);
  });

  it("returns null when no tab has an active presence", async () => {
    const { pickBroadcastEntry } = await import("@/background/managers/activity-manager");
    expect(await pickBroadcastEntry(baseSettings)).toBeNull();
  });

  it("focused mode broadcasts the focused tab's presence when one exists", async () => {
    const { pickBroadcastEntry } = await import("@/background/managers/activity-manager");
    await upsertTabPresence(1, presence("youtube", 1000));
    await upsertTabPresence(2, presence("twitch", 2000));
    setFocusedTabId(1);

    expect((await pickBroadcastEntry(baseSettings))?.slug).toBe("youtube");
  });

  it("focused mode falls back to the most recently updated tab when nothing is focused", async () => {
    const { pickBroadcastEntry } = await import("@/background/managers/activity-manager");
    await upsertTabPresence(1, presence("youtube", 1000));
    await upsertTabPresence(2, presence("twitch", 2000));
    setFocusedTabId(null);

    expect((await pickBroadcastEntry(baseSettings))?.slug).toBe("twitch");
  });

  it("priority mode picks the entry earliest in activityPriorityOrder", async () => {
    const { pickBroadcastEntry } = await import("@/background/managers/activity-manager");
    await upsertTabPresence(1, presence("youtube", 1000));
    await upsertTabPresence(2, presence("twitch", 2000));
    setFocusedTabId(2);

    const settings: ExtensionSettings = {
      ...baseSettings,
      activitySelectionMode: "priority",
      activityPriorityOrder: ["youtube", "twitch"]
    };
    expect((await pickBroadcastEntry(settings))?.slug).toBe("youtube");
  });

  it("priority mode puts slugs absent from the order last", async () => {
    const { pickBroadcastEntry } = await import("@/background/managers/activity-manager");
    await upsertTabPresence(1, presence("unranked", 1000));
    await upsertTabPresence(2, presence("ranked", 2000));

    const settings: ExtensionSettings = {
      ...baseSettings,
      activitySelectionMode: "priority",
      activityPriorityOrder: ["ranked"]
    };
    expect((await pickBroadcastEntry(settings))?.slug).toBe("ranked");
  });
});

describe("shouldHoldDiscord", () => {
  const storedPresence = (overrides: Partial<StoredPresence> = {}): StoredPresence => ({
    metadata: {
      slug: "p",
      name: "p",
      author: { name: "a" },
      description: {},
      url: [],
      color: "#000",
      category: "other"
    },
    release: {
      slug: "p",
      version: "1.0.0",
      metadata: {} as never,
      bundle: "",
      sha256: "",
      metadataHash: "",
      signature: "",
      signedAt: ""
    },
    enabled: true,
    installedAt: 0,
    ...overrides
  });

  it("handles hold rules: global pause, active vs expired snooze, and schedule adherence", async () => {
    const chrome = installChromeMock();
    const { shouldHoldDiscord } = await import("@/background/managers/activity-manager");

    // 1. Globally paused
    chrome.local.settings = {
      ...baseSettings,
      presencePaused: true
    };
    expect(await shouldHoldDiscord(storedPresence())).toBe(true);

    // 2. Snooze active vs expired
    chrome.local.settings = baseSettings;
    expect(await shouldHoldDiscord(storedPresence({ snoozeUntil: Date.now() + 60_000 }))).toBe(true);
    expect(await shouldHoldDiscord(storedPresence({ snoozeUntil: Date.now() - 1 }))).toBe(false);

    // 3. Schedule enabled & outside days vs schedule disabled
    const otherDay = (new Date().getDay() + 1) % 7;
    chrome.local.settings = {
      ...baseSettings,
      scheduleEnabled: true
    };
    expect(
      await shouldHoldDiscord(
        storedPresence({
          schedule: {
            days: [otherDay]
          }
        })
      )
    ).toBe(true);

    chrome.local.settings = {
      ...baseSettings,
      scheduleEnabled: false
    };
    expect(
      await shouldHoldDiscord(
        storedPresence({
          schedule: {
            days: []
          }
        })
      )
    ).toBe(false);
  });
});