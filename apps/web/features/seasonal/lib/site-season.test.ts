import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

import {
  applySeasonClass,
  initialSeasonState,
  nextSeasonState,
  parseSeasonMessage,
  parseSeasonPreview,
  readStoredSeason,
  seasonBootScript,
  seasonToStore,
  type SeasonState,
} from "./site-season";

const fakeClassList = (initial: string[] = []) => {
  const tokens = new Set(initial);
  return { tokens, add: (token: string) => tokens.add(token), remove: (token: string) => tokens.delete(token) };
};

const runBoot = ({ allowPreview, search = "", stored = null }: { allowPreview: boolean; search?: string; stored?: string | null }) => {
  const classList = fakeClassList(["font"]);
  runInNewContext(seasonBootScript(allowPreview), {
    URLSearchParams,
    location: { search },
    localStorage: { getItem: () => stored },
    document: { documentElement: { classList } },
  });
  return [...classList.tokens];
};

describe("parseSeasonMessage", () => {
  it("reads a season sent by the extension", () => {
    expect(parseSeasonMessage({ source: "Nowly", type: "SEASON", payload: { season: "halloween" } })).toEqual({ season: "halloween" });
    expect(parseSeasonMessage({ source: "Nowly", type: "SEASON", payload: { season: null } })).toEqual({ season: null });
  });

  it("treats a season this site does not know yet as no season", () => {
    expect(parseSeasonMessage({ source: "Nowly", type: "SEASON", payload: { season: "lunar-new-year" } })).toEqual({ season: null });
  });

  it("ignores anything else", () => {
    expect(parseSeasonMessage({ source: "Nowly", type: "EXT_DETECTED" })).toBeNull();
    expect(parseSeasonMessage({ source: "Other", type: "SEASON", payload: { season: "winter" } })).toBeNull();
    expect(parseSeasonMessage({ source: "Nowly", type: "SEASON" })).toBeNull();
    expect(parseSeasonMessage({ source: "Nowly", type: "SEASON", payload: { season: 3 } })).toBeNull();
    expect(parseSeasonMessage("SEASON")).toBeNull();
  });
});

describe("parseSeasonPreview and readStoredSeason", () => {
  it("only accepts known seasons and none", () => {
    expect(parseSeasonPreview("?season=winter")).toBe("winter");
    expect(parseSeasonPreview("?season=none")).toBe("none");
    expect(parseSeasonPreview("?season=easter")).toBeNull();
    expect(parseSeasonPreview("")).toBeNull();
    expect(readStoredSeason("spring")).toBe("spring");
    expect(readStoredSeason("bogus")).toBeNull();
    expect(readStoredSeason(null)).toBeNull();
  });
});

describe("season state", () => {
  const stored: SeasonState = { season: "halloween", source: "stored" };

  it("starts from the remembered season, or the preview first", () => {
    expect(initialSeasonState({ stored: "halloween", preview: null })).toEqual(stored);
    expect(initialSeasonState({ stored: null, preview: null })).toEqual({ season: null, source: "none" });
    expect(initialSeasonState({ stored: "halloween", preview: "winter" })).toEqual({ season: "winter", source: "preview" });
    expect(initialSeasonState({ stored: "halloween", preview: "none" })).toEqual({ season: null, source: "preview" });
  });

  it("is confirmed, changed or removed by the extension", () => {
    expect(nextSeasonState(stored, { type: "extension", season: "halloween" })).toEqual({ season: "halloween", source: "extension" });
    expect(nextSeasonState(stored, { type: "extension", season: null })).toEqual({ season: null, source: "extension" });
    expect(nextSeasonState(stored, { type: "extension", season: "winter" })).toEqual({ season: "winter", source: "extension" });
  });

  it("is removed when the extension stays silent", () => {
    expect(nextSeasonState(stored, { type: "timeout" })).toEqual({ season: null, source: "none" });
    const answered: SeasonState = { season: "autumn", source: "extension" };
    expect(nextSeasonState(answered, { type: "timeout" })).toBe(answered);
  });

  it("keeps a preview whatever happens", () => {
    const preview: SeasonState = { season: "spring", source: "preview" };
    expect(nextSeasonState(preview, { type: "extension", season: null })).toBe(preview);
    expect(nextSeasonState(preview, { type: "timeout" })).toBe(preview);
  });

  it("stores what the extension said and clears it when it is gone", () => {
    expect(seasonToStore({ season: "winter", source: "extension" })).toBe("winter");
    expect(seasonToStore({ season: null, source: "extension" })).toBeNull();
    expect(seasonToStore({ season: null, source: "none" })).toBeNull();
    expect(seasonToStore(stored)).toBeUndefined();
    expect(seasonToStore({ season: "winter", source: "preview" })).toBeUndefined();
  });
});

describe("applySeasonClass", () => {
  it("keeps exactly one season class and leaves the others alone", () => {
    const classList = fakeClassList(["dark", "season-winter"]);
    applySeasonClass(classList, "halloween");
    expect([...classList.tokens].sort()).toEqual(["dark", "season-halloween"]);
    applySeasonClass(classList, null);
    expect([...classList.tokens]).toEqual(["dark"]);
  });
});

describe("seasonBootScript", () => {
  it("applies the remembered season before the first paint", () => {
    expect(runBoot({ allowPreview: false, stored: "halloween" })).toEqual(["font", "season-halloween"]);
    expect(runBoot({ allowPreview: false, stored: "bogus" })).toEqual(["font"]);
    expect(runBoot({ allowPreview: false })).toEqual(["font"]);
  });

  it("honours the preview parameter only when allowed", () => {
    expect(runBoot({ allowPreview: true, search: "?season=winter", stored: "halloween" })).toEqual(["font", "season-winter"]);
    expect(runBoot({ allowPreview: true, search: "?season=none", stored: "halloween" })).toEqual(["font"]);
    expect(runBoot({ allowPreview: false, search: "?season=winter" })).toEqual(["font"]);
  });

  it("survives a blocked storage", () => {
    const classList = fakeClassList();
    const context = {
      URLSearchParams,
      location: { search: "" },
      localStorage: { getItem: () => { throw new Error("blocked"); } },
      document: { documentElement: { classList } },
    };
    expect(() => runInNewContext(seasonBootScript(false), context)).not.toThrow();
    expect(classList.tokens.size).toBe(0);
  });
});
