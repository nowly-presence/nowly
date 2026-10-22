import { describe, expect, it } from "vitest";
import { CUSTOM_ACTIVITY_FILE_FORMAT, CUSTOM_ACTIVITY_FILE_MAX_BYTES, activityFileName, buildActivityFile, parseActivityFile, serializeActivityFile } from "@/shared/custom-activity-share";
import type { CustomActivity } from "@/shared/types";

const PNG_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAHnOcQAAAAABJRU5ErkJggg==";
const activity: CustomActivity = {
  id: "abc",
  name: "Revision",
  type: 0,
  details: "Chapter 4",
  state: "Pomodoro",
  largeImage: {
    kind: "icon",
    icon: "graduation",
    color: "#5a6bb0"
  },
  largeText: "",
  smallImage: {
    kind: "upload",
    hash: "h1",
    mime: "image/png",
    size: 10,
    remoteUrl: "https://cdn.nowly.me/custom/x.png"
  },
  smallText: "",
  timestamp: {
    mode: "countdown",
    minutes: 25
  },
  buttons: [
    {
      label: "Docs",
      url: "https://nowly.me"
    }
  ],
  detectionUrl: "",
  createdAt: 1,
  updatedAt: 2
};

const roundTrip = (value: unknown) => parseActivityFile(JSON.stringify(value));

describe("activityFileName", () => {
  it("keeps the name and adds .json", () => expect(activityFileName("Revision")).toBe("Revision.json"));
  it("removes forbidden characters", () => expect(activityFileName('a/b:c*d?"e')).toBe("a b c d e.json"));
  it("falls back when nothing is left", () => expect(activityFileName("///")).toBe("activity.json"));
  it("limits the length", () => expect(activityFileName("x".repeat(300)).length).toBeLessThanOrEqual(85));
});

describe("buildActivityFile", () => {
  it("never exports local identity, dates or upload urls", () => {
    const file = buildActivityFile(activity, { h1: PNG_DATA_URL });
    expect(file.format).toBe(CUSTOM_ACTIVITY_FILE_FORMAT);
    expect(JSON.stringify(file)).not.toContain("cdn.nowly.me");

    for (const key of ["id", "createdAt", "updatedAt", "activeId", "activatedAt"]) expect(Object.keys(file.activity)).not.toContain(key);

    expect(file.activity.smallImage).toEqual({
      kind: "embedded",
      dataUrl: PNG_DATA_URL
    });
  });
  it("drops an uploaded image without a local copy", () => {
    expect(buildActivityFile(activity, {}).activity.smallImage).toEqual({ kind: "none" });
  });
});

describe("parseActivityFile", () => {
  it("round-trips an exported activity", () => {
    const result = parseActivityFile(serializeActivityFile(buildActivityFile(activity, { h1: PNG_DATA_URL })));
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    expect(result.draft.name).toBe("Revision");
    expect(result.draft.largeImage).toEqual(activity.largeImage);
    expect(result.draft.smallImage).toEqual({ kind: "none" });
    expect(result.images.smallImage).toBe(PNG_DATA_URL);
    expect(result.draft.timestamp).toEqual({
      mode: "countdown",
      minutes: 25
    });
    expect(result.draft.buttons).toEqual(activity.buttons);
  });
  it("rejects non-JSON", () =>
    expect(parseActivityFile("nope")).toEqual({
      ok: false,
      error: "INVALID_JSON"
    }));
  it("rejects unrelated JSON", () =>
    expect(roundTrip({ hello: 1 })).toEqual({
      ok: false,
      error: "WRONG_FORMAT"
    }));
  it("rejects unsupported versions", () =>
    expect(
      roundTrip({
        format: CUSTOM_ACTIVITY_FILE_FORMAT,
        version: 99,
        activity: {}
      })
    ).toEqual({
      ok: false,
      error: "UNSUPPORTED_VERSION"
    }));
  it("rejects huge files", () =>
    expect(parseActivityFile(" ".repeat(CUSTOM_ACTIVITY_FILE_MAX_BYTES + 1))).toEqual({
      ok: false,
      error: "TOO_LARGE"
    }));
  it("counts UTF-8 bytes, not characters", () =>
    expect(parseActivityFile("あ".repeat(Math.ceil(CUSTOM_ACTIVITY_FILE_MAX_BYTES / 3)))).toEqual({
      ok: false,
      error: "TOO_LARGE"
    }));
  it("rejects invalid activities", () => {
    const file = buildActivityFile(activity, {});

    for (const patch of [
      { name: "" },
      { type: 7 },
      {
        buttons: [
          {
            label: "Bad",
            url: "http://example.com"
          }
        ]
      },
      {
        timestamp: {
          mode: "countdown",
          minutes: 1
        }
      },
      {
        largeImage: {
          kind: "icon",
          icon: "skull",
          color: "#000000"
        }
      },
      {
        largeImage: {
          kind: "url",
          url: "javascript:alert(1)"
        }
      },
      {
        smallImage: {
          kind: "upload",
          hash: "external",
          remoteUrl: "https://example.com/image.png"
        }
      }
    ])
      expect(
        roundTrip({
          ...file,
          activity: { ...file.activity, ...patch }
        })
      ).toEqual({
        ok: false,
        error: "INVALID_ACTIVITY"
      });
  });
  it("rejects fake embedded images", () => {
    const file = buildActivityFile(activity, {});
    expect(
      roundTrip({
        ...file,
        activity: {
          ...file.activity,
          smallImage: {
            kind: "embedded",
            dataUrl: "data:image/png;base64,AAAAAAAA"
          }
        }
      })
    ).toEqual({
      ok: false,
      error: "INVALID_ACTIVITY"
    });
  });
  it("ignores unknown identity fields", () => {
    const file = buildActivityFile(activity, {});
    const result = roundTrip({
      ...file,
      activity: {
        ...file.activity,
        id: "evil",
        createdAt: 5,
        extra: true
      }
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(Object.keys(result.draft)).not.toContain("id");
  });
  it("keeps explicit HTTPS image links", () => {
    const image = {
      kind: "url",
      url: "https://example.com/image.png"
    };
    const file = buildActivityFile(activity, {});
    const result = roundTrip({
      ...file,
      activity: {
        ...file.activity,
        smallImage: image
      }
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.draft.smallImage).toEqual(image);
  });
});