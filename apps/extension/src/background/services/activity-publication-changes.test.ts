import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasPublicationChanges } from "./activity-publication-data";
import { emptyCustomActivityDraft } from "@/shared/custom-activity";
import { portableActivity } from "@/shared/activity-publication";
import { installChromeMock } from "@/test/chrome-mock";

vi.mock("@/background/services/api-state", () => ({
  getEffectiveApiUrl: () => "https://api.nowly.me"
}));

const id = "b".repeat(32);
const activity = {
  ...emptyCustomActivityDraft(() => 0),
  id: "saved-id",
  name: "Saved activity",
  createdAt: 1,
  updatedAt: 1
};

const publication = () => ({
  id,
  revision: 1,
  activity: portableActivity(activity, {}),
  author: {
    name: "Camille",
    image: null
  }
});

describe("publisher saved-content comparison", () => {
  beforeEach(() => {
    installChromeMock();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(publication()))
    );
  });
  it("ignores local metadata and private detection changes", async () => {
    expect(
      await hasPublicationChanges(
        {
          ...activity,
          updatedAt: 2,
          detectionUrl: "private.example.com"
        },
        id,
        1
      )
    ).toBe(false);
  });
  it("detects changed saved public content and reverting to the published version", async () => {
    expect(
      await hasPublicationChanges(
        {
          ...activity,
          details: "New saved content"
        },
        id,
        1
      )
    ).toBe(true);
    expect(await hasPublicationChanges(activity, id, 1)).toBe(false);
  });
  it("keeps comparisons unknown on outages, invalid data and stale revisions", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("", { status: 503 }));
    expect(await hasPublicationChanges(activity, id, 1)).toBeNull();
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ invalid: true }));
    expect(await hasPublicationChanges(activity, id, 1)).toBeNull();
    expect(await hasPublicationChanges(activity, id, 2)).toBeNull();
  });
});