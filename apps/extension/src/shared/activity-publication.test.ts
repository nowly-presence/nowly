import { describe, expect, it } from "vitest";
import { activityFingerprint, portableActivity } from "@/shared/activity-publication";
import { CUSTOM_ACTIVITY_COLORS, CUSTOM_ACTIVITY_ICONS, emptyCustomActivityDraft } from "@/shared/custom-activity";
import { publicationColors, publicationIcons } from "@nowly/shared/activity-publication";
import type { CustomActivity } from "@/shared/types";

const HASH = "a".repeat(64);
const DATA_URL = "data:image/png;base64,iVBORw0KGgo=";
const activity: CustomActivity = {
  ...emptyCustomActivityDraft(() => 0),
  id: "local-id",
  name: "Study time",
  createdAt: 1,
  updatedAt: 1,
  detectionUrl: "private.example.com",
  largeImage: {
    kind: "upload",
    hash: HASH,
    mime: "image/png",
    size: 8,
    remoteUrl: "https://cdn.nowly.me/temporary.png",
    lastUsedAt: 1
  }
};

describe("canonical portable publication baseline", () => {
  it("uses the extension's actual image icon and color contract", () => {
    expect(publicationColors).toEqual(CUSTOM_ACTIVITY_COLORS);
    expect(publicationIcons).toEqual(CUSTOM_ACTIVITY_ICONS);
  });
  it("embeds durable images, excludes private/runtime fields and ignores CDN touches and dates", async () => {
    const original = portableActivity(activity, { [HASH]: DATA_URL });
    const touched = {
      ...activity,
      id: "different-local-id",
      createdAt: 3,
      updatedAt: 4,
      detectionUrl: "other-private.example.com",
      largeImage: {
        ...activity.largeImage,
        lastUsedAt: 5,
        remoteUrl: "https://cdn.nowly.me/new-url.png"
      }
    };
    const portable = portableActivity(touched, { [HASH]: DATA_URL });
    expect(portable).toEqual(original);
    expect(portable.largeImage).toEqual({
      kind: "embedded",
      dataUrl: DATA_URL
    });
    expect(await activityFingerprint(portable)).toBe(await activityFingerprint(original));
    expect(await activityFingerprint(portable, "private.example.com")).not.toBe(await activityFingerprint(portable));
  });
  it("refuses to publish a missing image rather than silently dropping it", () => {
    expect(() => portableActivity(activity, {})).toThrow("MISSING_IMAGE");
  });
});