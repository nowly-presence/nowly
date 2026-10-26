import { describe, expect, it } from "vitest";
import type { PortableActivity } from "@nowly/shared";
import { previewClock, previewHeader, previewImage, previewLines } from "./activity-preview";
import { publicationColors, publicationIcons } from "@nowly/shared/activity-publication";
import { ACTIVITY_ICON_COLORS, ACTIVITY_ICON_KEYS } from "../../../app/api/activity-icon/activity-icons";

const activity: PortableActivity = {
  name: "Study session",
  type: 0,
  details: "Reading books",
  state: "In the library",
  largeImage: { kind: "none" },
  largeText: "",
  smallImage: { kind: "none" },
  smallText: "",
  timestamp: {
    mode: "countdown",
    minutes: 25
  },
  buttons: [
    {
      label: "Read more",
      url: "https://example.com"
    }
  ]
};

describe("custom activity public preview parity", () => {
  it("accepts exactly the deployed icon route keys and colors", () => {
    expect(publicationIcons).toEqual(ACTIVITY_ICON_KEYS);
    expect(publicationColors.map((color) => color.slice(1))).toEqual(ACTIVITY_ICON_COLORS);
  });
  it("matches LiveCard name, details and state layouts for all supported types", () => {
    expect(previewHeader(activity)).toBe("playing");
    expect(previewLines(activity)).toEqual([activity.name, activity.details, activity.state]);

    for (const type of [2, 3, 5] as const) {
      expect(previewLines({ ...activity, type })).toEqual([activity.details, activity.state]);
      const minimal = {
        ...activity,
        type,
        details: "",
        state: ""
      };
      expect(previewLines(minimal)).toEqual([activity.name]);
      expect(previewHeader(minimal)).toMatch(/Type$/);
    }
  });
  it("preserves durable images and the exact icon route, without a server image fetch", () => {
    expect(previewImage({ kind: "none" })).toBeNull();
    expect(
      previewImage({
        kind: "url",
        url: "https://example.com/art.png"
      })
    ).toBe("https://example.com/art.png");
    expect(
      previewImage({
        kind: "embedded",
        dataUrl: "data:image/png;base64,iVBORw0KGgo="
      })
    ).toBe("data:image/png;base64,iVBORw0KGgo=");
    expect(
      previewImage({
        kind: "icon",
        icon: "book",
        color: "#0891B2"
      })
    ).toBe("/api/activity-icon/book/0891b2.png?v=1");
  });
  it("matches elapsed and countdown clocks including hours and completed countdowns", () => {
    expect(previewClock(0)).toBe("0:00");
    expect(previewClock(25 * 60)).toBe("25:00");
    expect(previewClock(3661)).toBe("1:01:01");
    expect(previewClock(-1)).toBe("0:00");
  });
});