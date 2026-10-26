import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveCustomActivity } from "@/background/managers/custom-activity-manager";
import { getCustomActivities, setCustomActivities } from "@/background/storage/custom-activities.store";
import { emptyCustomActivityDraft } from "@/shared/custom-activity";
import { installChromeMock } from "@/test/chrome-mock";

vi.mock("@/background/managers/activity-manager", () => ({ broadcastActiveTab: vi.fn() }));
vi.mock("@/background/services/custom-assets-api", () => ({
  deleteCustomAsset: vi.fn(),
  touchCustomAsset: vi.fn(),
  uploadCustomAsset: vi.fn()
}));
vi.mock("@/background/services/custom-activity-detection", () => ({
  readCustomActivityDetection: async () => null
}));

const original = {
  ...emptyCustomActivityDraft(() => 0),
  id: "local-copy",
  name: "Original",
  createdAt: 1,
  updatedAt: 1
};

describe("custom activity optimistic editor save", () => {
  beforeEach(() => {
    installChromeMock();
  });
  it("prevents a stale unsaved draft from overwriting an applied update", async () => {
    const updated = {
      ...original,
      name: "Reviewed replacement",
      updatedAt: 2
    };
    await setCustomActivities({
      items: [updated],
      activeId: null,
      activatedAt: null
    });
    expect(
      await saveCustomActivity(
        {
          ...original,
          name: "Unsaved old draft"
        },
        1
      )
    ).toEqual({
      ok: false,
      error: "LOCAL_CHANGED"
    });
    expect((await getCustomActivities()).items[0]).toEqual(updated);
  });
  it("serializes competing saves against the same revision", async () => {
    await setCustomActivities({
      items: [original],
      activeId: null,
      activatedAt: null
    });
    const outcomes = await Promise.all([
      saveCustomActivity(
        {
          ...original,
          name: "First edit"
        },
        1
      ),
      saveCustomActivity(
        {
          ...original,
          name: "Second edit"
        },
        1
      )
    ]);
    expect(outcomes.map((outcome) => outcome.ok)).toEqual([true, false]);
    expect((await getCustomActivities()).items[0].name).toBe("First edit");
  });
});