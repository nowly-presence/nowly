import { beforeEach, describe, expect, it } from "vitest";
import { getEffectiveCustomActivity, getEffectiveCustomPresence, refreshCustomActivityDetection, resolveCustomActivityDetection } from "@/background/services/custom-activity-detection";
import { setCustomActivities } from "@/background/storage/custom-activities.store";
import { emptyCustomActivityDraft } from "@/shared/custom-activity";
import { CUSTOM_ACTIVITY_DETECTION_KEY } from "@/shared/custom-activity-detection";
import { installChromeMock } from "@/test/chrome-mock";
import type { CustomActivity } from "@/shared/types";

const activatedAt = Date.parse("2026-09-29T12:00:00.000Z");
const TAB_ID = 7;

const activity = (overrides: Partial<CustomActivity> = {}): CustomActivity => ({
  ...emptyCustomActivityDraft(() => 0),
  id: "a1",
  name: "Movie night",
  details: "Netflix party",
  createdAt: 0,
  updatedAt: 0,
  detectionUrl: "watchparty.netflix.com",
  ...overrides
});

const storeTabs = (url: string | null): void => {
  (
    globalThis as {
      chrome: {
        tabs: unknown;
      };
    }
  ).chrome.tabs = {
    query: async () =>
      url
        ? [
            {
              id: TAB_ID,
              url
            }
          ]
        : []
  };
};

describe("custom activity detection", () => {
  let storage: {
    local: Record<string, unknown>;
    session: Record<string, unknown>;
  };

  beforeEach(() => {
    storage = installChromeMock();
    storeTabs("https://watchparty.netflix.com/room/42");
  });

  it("resolves matching activities, prioritizes manual selection, and handles edge cases", async () => {
    // 1. Matches tab URL
    await setCustomActivities({
      items: [activity()],
      activeId: null,
      activatedAt: null
    });
    expect(await resolveCustomActivityDetection()).toEqual({
      activityId: "a1",
      host: "watchparty.netflix.com",
      tabId: TAB_ID,
      activatedAt: expect.any(Number)
    });
    expect(await getEffectiveCustomPresence()).toEqual(
      expect.objectContaining({
        slug: "custom:a1",
        host: "watchparty.netflix.com"
      })
    );

    // 2. Ignores non-matching site
    storeTabs("https://example.com/room");
    expect(await resolveCustomActivityDetection()).toBeNull();
    expect(await getEffectiveCustomActivity()).toBeNull();

    // 3. Manual selection wins and clears detection
    storeTabs("https://watchparty.netflix.com/room/42");
    await setCustomActivities({
      items: [activity()],
      activeId: "a1",
      activatedAt
    });
    storage.session[CUSTOM_ACTIVITY_DETECTION_KEY] = {
      activityId: "a1",
      host: "watchparty.netflix.com",
      tabId: TAB_ID,
      activatedAt: activatedAt - 1000
    };
    expect(await resolveCustomActivityDetection()).toBeNull();
    expect(storage.session[CUSTOM_ACTIVITY_DETECTION_KEY]).toBeNull();
    expect(await getEffectiveCustomActivity()).toEqual({
      activity: expect.objectContaining({ id: "a1" }),
      activatedAt,
      detected: false,
      host: null
    });

    // 4. Fallback on unreadable tab URL and picks latest updated
    const detection = {
      activityId: "new",
      host: "watchparty.netflix.com",
      tabId: TAB_ID,
      activatedAt
    };
    await setCustomActivities({
      items: [
        activity({ id: "old", updatedAt: 1 }),
        activity({ id: "new", updatedAt: 2 })
      ],
      activeId: null,
      activatedAt: null
    });
    expect(await resolveCustomActivityDetection()).toEqual(expect.objectContaining({ activityId: "new" }));

    // Unreadable tab keeps previous
    storage.session[CUSTOM_ACTIVITY_DETECTION_KEY] = detection;
    storeTabs(null);
    expect(await resolveCustomActivityDetection()).toEqual(detection);
  });

  it("reports changes and preserves ongoing activation time", async () => {
    storeTabs("https://watchparty.netflix.com/room/42");
    await setCustomActivities({
      items: [activity()],
      activeId: null,
      activatedAt: null
    });

    expect(await refreshCustomActivityDetection()).toBe(true);
    expect(await refreshCustomActivityDetection()).toBe(false);

    storage.session[CUSTOM_ACTIVITY_DETECTION_KEY] = {
      activityId: "a1",
      host: "watchparty.netflix.com",
      tabId: TAB_ID,
      activatedAt
    };
    expect(await resolveCustomActivityDetection()).toEqual(expect.objectContaining({ activatedAt }));
  });
});