import { describe, expect, it } from "vitest";
import { buildCustomPresence, customActivityIdOf, customActivitySlug, customImageHashes, CUSTOM_IMAGE_EXPIRED_MS, CUSTOM_IMAGE_TOUCH_INTERVAL_MS, emptyCustomActivityDraft, customImageSync, randomIconImage, customIconImageUrl, clampCountdown, validateCustomActivity, CUSTOM_ACTIVITY_COLORS } from "@/shared/custom-activity";
import type { CustomActivityDraft } from "@/shared/types";

const now = Date.parse("2026-09-29T12:00:00.000Z");

const draft = (overrides: Partial<CustomActivityDraft> = {}): CustomActivityDraft => ({
  ...emptyCustomActivityDraft(() => 0),
  name: "Studying",
  ...overrides
});

describe("validateCustomActivity", () => {
  it("requires a name of at least two characters", () => {
    expect(validateCustomActivity(draft({ name: " " })).name).toBe("required");
    expect(validateCustomActivity(draft({ name: "A" })).name).toBe("tooShort");
    expect(validateCustomActivity(draft())).toEqual({});
  });

  it("only accepts https image and button links", () => {
    const errors = validateCustomActivity(
      draft({
        largeImage: {
          kind: "url",
          url: "http://example.com/a.png"
        },
        buttons: [
          {
            label: "Site",
            url: "ftp://example.com"
          }
        ]
      })
    );
    expect(errors.largeImage).toBe("httpsOnly");
    expect(errors.button0Url).toBe("httpsOnly");
    expect(
      validateCustomActivity(
        draft({
          buttons: [
            {
              label: "Site",
              url: "not a url"
            }
          ]
        })
      ).button0Url
    ).toBe("invalidUrl");
  });

  it("bounds the countdown duration", () => {
    expect(
      validateCustomActivity(
        draft({
          timestamp: {
            mode: "countdown",
            minutes: 0
          }
        })
      ).countdown
    ).toBe("outOfRange");
    expect(
      validateCustomActivity(
        draft({
          timestamp: {
            mode: "countdown",
            minutes: Number.NaN
          }
        })
      ).countdown
    ).toBe("outOfRange");
    expect(clampCountdown(3)).toBe(5);
    expect(clampCountdown(99_999)).toBe(24 * 60);
    expect(
      validateCustomActivity(
        draft({
          timestamp: {
            mode: "countdown",
            minutes: 45
          }
        })
      ).countdown
    ).toBeUndefined();
  });
});

describe("buildCustomPresence", () => {
  it("maps text, timestamps and https buttons", () => {
    const presence = buildCustomPresence(
      draft({
        details: "Chapter 3",
        timestamp: {
          mode: "countdown",
          minutes: 25
        },
        buttons: [
          {
            label: "Notes",
            url: "https://notes.example"
          }
        ]
      }),
      now
    );
    expect(presence).toMatchObject({
      name: "Studying",
      details: "Chapter 3",
      type: 0,
      startTime: now / 1000,
      endTime: now / 1000 + 25 * 60
    });
    expect(presence.state).toBeUndefined();
    expect(presence.buttons).toEqual([
      {
        label: "Notes",
        url: "https://notes.example"
      }
    ]);
  });

  it("falls back to the Nowly logo when there is no large image", () => {
    const presence = buildCustomPresence(
      draft({
        largeImage: { kind: "none" },
        smallImage: {
          kind: "url",
          url: "https://cdn.example/small.png"
        },
        smallText: "Hi"
      }),
      now
    );
    expect(presence.largeImage).toBe("https://cdn.nowly.me/brand/icons/blue/512.png");
    expect(presence.smallImage).toBe("https://cdn.example/small.png");
    expect(presence.smallText).toBe("Hi");
  });

  it("sends a generated image for the icon mode", () => {
    const presence = buildCustomPresence(
      draft({
        largeImage: {
          kind: "icon",
          icon: "book",
          color: "#5A6BB0"
        }
      }),
      now
    );
    expect(presence.largeImage).toBe(customIconImageUrl("book", "#5A6BB0"));
    expect(presence.largeImage).toMatch(/\/api\/activity-icon\/book\/5a6bb0\.png\?v=\d+$/);
  });

  it("uses the uploaded copy on the CDN", () => {
    const presence = buildCustomPresence(
      draft({
        largeImage: {
          kind: "upload",
          hash: "abc",
          mime: "image/png",
          size: 10,
          remoteUrl: "https://cdn.nowly.me/custom/abc.png"
        },
        largeText: "Cover"
      }),
      now
    );
    expect(presence.largeImage).toBe("https://cdn.nowly.me/custom/abc.png");
    expect(presence.largeText).toBe("Cover");
  });

  it("always sends a start time, Discord shows elapsed time anyway", () => {
    expect(
      buildCustomPresence(
        draft({
          timestamp: { mode: "elapsed" }
        }),
        now
      ).startTime
    ).toBe(now / 1000);
  });
});

describe("custom image lifecycle", () => {
  it("touches recently used uploads and re-uploads the ones the CDN may have dropped", () => {
    const uploaded = {
      kind: "upload",
      hash: "a",
      mime: "image/png",
      size: 1,
      remoteUrl: "https://x.y/a"
    } as const;
    expect(
      customImageSync(
        {
          kind: "upload",
          hash: "a",
          mime: "image/png",
          size: 1
        },
        now
      )
    ).toBe("upload");
    expect(
      customImageSync(
        {
          ...uploaded,
          lastUsedAt: now - 1000
        },
        now
      )
    ).toBe("fresh");
    expect(
      customImageSync(
        {
          ...uploaded,
          lastUsedAt: now - CUSTOM_IMAGE_TOUCH_INTERVAL_MS
        },
        now
      )
    ).toBe("touch");
    expect(
      customImageSync(
        {
          ...uploaded,
          lastUsedAt: now - CUSTOM_IMAGE_EXPIRED_MS
        },
        now
      )
    ).toBe("upload");
    expect(
      customImageSync(
        {
          kind: "url",
          url: "https://x.y/a"
        },
        now
      )
    ).toBe("fresh");
  });

  it("lists the local images still referenced", () => {
    const hashes = customImageHashes([
      draft({
        largeImage: {
          kind: "upload",
          hash: "a",
          mime: "image/png",
          size: 1
        },
        smallImage: {
          kind: "upload",
          hash: "b",
          mime: "image/png",
          size: 1
        }
      }),
      draft({
        largeImage: {
          kind: "url",
          url: "https://x.y/c"
        }
      })
    ]);
    expect([...hashes]).toEqual(["a", "b"]);
  });
});

describe("custom activity helpers", () => {
  it("round-trips the broadcast slug", () => {
    expect(customActivityIdOf(customActivitySlug("123"))).toBe("123");
    expect(customActivityIdOf("youtube")).toBeNull();
  });

  it("picks a colour and icon from the palette", () => {
    expect(randomIconImage(() => 0.999).color).toBe(CUSTOM_ACTIVITY_COLORS.at(-1));
    expect(emptyCustomActivityDraft(() => 0).largeImage.kind).toBe("icon");
  });
});