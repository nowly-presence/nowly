import { describe, expect, it } from "vitest";
import { portableActivitySchema, publicationReserveSchema, publicationWriteSchema, ownedPublicationSchema } from "@nowly/shared/activity-publication";

const activity = {
  name: "Study time",
  type: 0,
  details: "Reading books",
  state: "",
  largeImage: { kind: "none" },
  largeText: "",
  smallImage: { kind: "none" },
  smallText: "",
  timestamp: { mode: "elapsed" },
  buttons: []
};

describe("public custom activity contract", () => {
  it("separates server reservation from revision-bound publishing", () => {
    expect(publicationReserveSchema.safeParse({ activity }).success).toBe(true);
    expect(
      publicationReserveSchema.safeParse({
        activity,
        id: "a".repeat(32)
      }).success
    ).toBe(false);
    expect(
      publicationWriteSchema.safeParse({
        activity,
        baseRevision: 0
      }).success
    ).toBe(false);
    expect(
      publicationWriteSchema.safeParse({
        activity,
        baseRevision: 0,
        id: "a".repeat(32)
      }).success
    ).toBe(true);
    expect(
      ownedPublicationSchema.safeParse({
        id: "a".repeat(32),
        revision: 0,
        published: false
      }).success
    ).toBe(true);
  });
  it("rejects private fields, forged authors, credentials, invalid timers and buttons", () => {
    expect(
      portableActivitySchema.safeParse({
        ...activity,
        detectionUrl: "private.example"
      }).success
    ).toBe(false);
    expect(
      portableActivitySchema.safeParse({
        ...activity,
        author: { name: "forged" }
      }).success
    ).toBe(false);

    for (const url of ["javascript:alert(1)", "http://example.com", "https://name:password@example.com"]) {
      expect(
        portableActivitySchema.safeParse({
          ...activity,
          largeImage: {
            kind: "url",
            url
          }
        }).success
      ).toBe(false);
    }

    expect(
      portableActivitySchema.safeParse({
        ...activity,
        timestamp: {
          mode: "countdown",
          minutes: 1441
        }
      }).success
    ).toBe(false);
    const buttons = Array.from({ length: 3 }, () => ({
      label: "Open",
      url: "https://example.com"
    }));
    expect(portableActivitySchema.safeParse({ ...activity, buttons }).success).toBe(false);
  });
  it("validates embedded image MIME, bytes and bounds and rejects HTML/SVG", () => {
    const invalidImages = [
      "data:image/svg+xml;base64,PHN2Zz4=",
      "data:image/png;base64,PGh0bWw+",
      "data:image/jpeg;base64,iVBORw0KGgo=",
      `data:image/png;base64,${"A".repeat(1_398_151)}`
    ];

    for (const dataUrl of invalidImages) {
      expect(
        portableActivitySchema.safeParse({
          ...activity,
          largeImage: {
            kind: "embedded",
            dataUrl
          }
        }).success
      ).toBe(false);
    }

    expect(
      portableActivitySchema.safeParse({
        ...activity,
        largeImage: {
          kind: "embedded",
          dataUrl: "data:image/png;base64,iVBORw0KGgo="
        }
      }).success
    ).toBe(true);
  });
});