import { describe, expect, it } from "vitest";
import { createDraft } from "@nowly/presence-creator/creator-draft";
import { buildCreatorDraftFile, creatorDraftFileName, parseCreatorDraftFile } from "@/shared/creator/creator-draft-file";

const NOW = 1_700_000_000_000;

const sample = () => ({
  ...createDraft("en-US", "example.com", 1),
  name: "My Presence",
  assets: {
    icon: "data:image/png;base64,AAAA",
    thumbnailRightsConfirmed: true
  }
});

describe("creator draft file", () => {
  it("round trips a draft under a new id without the submission link", () => {
    const draft = {
      ...sample(),
      submission: { id: "remote" } as never
    };
    const file = buildCreatorDraftFile(draft);
    expect("submission" in file.draft).toBe(false);

    const result = parseCreatorDraftFile(JSON.stringify(file), NOW);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    expect(result.draft.id).not.toBe(draft.id);
    expect(result.draft.name).toBe("My Presence");
    expect(result.draft.assets.icon).toBe("data:image/png;base64,AAAA");
    expect(result.draft.submission).toBeUndefined();
    expect(result.draft.createdAt).toBe(NOW);
  });

  it("rejects other files, other versions and broken drafts", () => {
    const file = buildCreatorDraftFile(sample());
    expect(parseCreatorDraftFile("nope")).toEqual({ ok: false, error: "INVALID_JSON" });
    expect(parseCreatorDraftFile(JSON.stringify({ ...file, format: "other" }))).toEqual({ ok: false, error: "WRONG_FORMAT" });
    expect(parseCreatorDraftFile(JSON.stringify({ ...file, version: 2 }))).toEqual({ ok: false, error: "UNSUPPORTED_VERSION" });
    expect(parseCreatorDraftFile(JSON.stringify({ ...file, draft: { ...file.draft, pages: "x" } }))).toEqual({ ok: false, error: "INVALID_DRAFT" });
  });

  it("refuses images that are not inline raster data", () => {
    const file = buildCreatorDraftFile(sample());
    const hostile = { ...file, draft: { ...file.draft, assets: { icon: "https://evil.example/x.png", thumbnailRightsConfirmed: true } } };
    expect(parseCreatorDraftFile(JSON.stringify(hostile))).toEqual({ ok: false, error: "INVALID_DRAFT" });
  });

  it("names the file after the presence", () => {
    expect(creatorDraftFileName("Café  Nowly!")).toBe("cafe-nowly-draft.json");
    expect(creatorDraftFileName("???")).toBe("presence-draft.json");
  });
});
