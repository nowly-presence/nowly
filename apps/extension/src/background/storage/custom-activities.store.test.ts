import { beforeEach, describe, expect, it } from "vitest";
import {
  getActiveCustomPresence,
  setCustomActivities,
} from "@/background/storage/custom-activities.store";
import { emptyCustomActivityDraft } from "@/shared/custom-activity";
import { installChromeMock } from "@/test/chrome-mock";
import type { CustomActivity } from "@/shared/types";

const activatedAt = Date.parse("2026-09-29T12:00:00.000Z");

const activity: CustomActivity = {
  ...emptyCustomActivityDraft(() => 0),
  id: "a1",
  name: "Reading",
  details: "Dune",
  createdAt: 0,
  updatedAt: 0,
};

describe("getActiveCustomPresence", () => {
  beforeEach(() => {
    installChromeMock();
  });

  it("returns nothing when no custom activity is switched on", async () => {
    await setCustomActivities({
      items: [activity],
      activeId: null,
      activatedAt: null,
    });
    expect(await getActiveCustomPresence()).toBeNull();
  });

  it("builds the broadcast payload of the active activity from its activation time", async () => {
    await setCustomActivities({
      items: [activity],
      activeId: "a1",
      activatedAt,
    });
    expect(await getActiveCustomPresence()).toEqual({
      slug: "custom:a1",
      presence: expect.objectContaining({
        name: "Reading",
        details: "Dune",
        startTime: activatedAt / 1000,
      }),
    });
  });

  it("ignores an active id whose activity was deleted", async () => {
    await setCustomActivities({ items: [], activeId: "a1", activatedAt });
    expect(await getActiveCustomPresence()).toBeNull();
  });
});