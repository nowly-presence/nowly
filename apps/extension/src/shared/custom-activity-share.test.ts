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

describe("custom-activity-share", () => {
  it("sanitizes export file names", () => {
    expect(activityFileName("Revision")).toBe("Revision.json");
    expect(activityFileName('a/b:c*d?"e')).toBe("a b c d e.json");
    expect(activityFileName("///")).toBe("activity.json");
    expect(activityFileName("x".repeat(300)).length).toBeLessThanOrEqual(85);
  });

  it("builds and roundtrips exported activities without leaking private identity fields", () => {
    const file = buildActivityFile(activity, { h1: PNG_DATA_URL });
    expect(file.format).toBe(CUSTOM_ACTIVITY_FILE_FORMAT);
    expect(JSON.stringify(file)).not.toContain("cdn.nowly.me");

    for (const key of ["id", "createdAt", "updatedAt", "activeId", "activatedAt"]) {
      expect(Object.keys(file.activity)).not.toContain(key);
    }

    const result = parseActivityFile(serializeActivityFile(file));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.draft.name).toBe("Revision");
    expect(result.draft.largeImage).toEqual(activity.largeImage);
    expect(result.images.smallImage).toBe(PNG_DATA_URL);
    expect(result.draft.buttons).toEqual(activity.buttons);

    // Drops upload without local copy
    expect(buildActivityFile(activity, {}).activity.smallImage).toEqual({ kind: "none" });
  });

  it("validates files and rejects malformed, oversized, or malicious content", () => {
    expect(parseActivityFile("nope")).toEqual({ ok: false, error: "INVALID_JSON" });
    expect(roundTrip({ hello: 1 })).toEqual({ ok: false, error: "WRONG_FORMAT" });
    expect(roundTrip({ format: CUSTOM_ACTIVITY_FILE_FORMAT, version: 99, activity: {} })).toEqual({
      ok: false,
      error: "UNSUPPORTED_VERSION"
    });
    expect(parseActivityFile(" ".repeat(CUSTOM_ACTIVITY_FILE_MAX_BYTES + 1))).toEqual({
      ok: false,
      error: "TOO_LARGE"
    });

    const file = buildActivityFile(activity, {});
    // Rejects invalid activity shapes (e.g. invalid type, bad url protocol)
    expect(roundTrip({ ...file, activity: { ...file.activity, type: 99 } })).toEqual({
      ok: false,
      error: "INVALID_ACTIVITY"
    });
    expect(
      roundTrip({
        ...file,
        activity: { ...file.activity, largeImage: { kind: "url", url: "javascript:alert(1)" } }
      })
    ).toEqual({ ok: false, error: "INVALID_ACTIVITY" });

    // Ignores unknown identity fields safely
    const stripped = roundTrip({ ...file, activity: { ...file.activity, id: "evil", extra: true } });
    expect(stripped.ok).toBe(true);
    if (stripped.ok) expect(Object.keys(stripped.draft)).not.toContain("id");
  });
});
