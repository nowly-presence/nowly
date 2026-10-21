import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { applySeasonClass, initialSeasonState, nextSeasonState, parseSeasonMessage, parseSeasonPreview, seasonBootScript, SEASON_STORAGE_KEY, SITE_SEASONS, type SeasonState } from "./site-season";

const fakeClassList = (initial: string[] = []) => {
  const tokens = new Set(initial);
  return {
    tokens,
    add: (token: string) => tokens.add(token),
    remove: (...removed: string[]) => removed.forEach((token) => tokens.delete(token))
  };
};

const runBoot = ({ allowPreview, search = "", stored = null, initial = ["font"] }: {
  allowPreview: boolean;
  search?: string;
  stored?: string | null;
  initial?: string[];
}) => {
  const classList = fakeClassList(initial);
  runInNewContext(seasonBootScript(allowPreview), {
    URLSearchParams,
    location: { search },
    localStorage: {
      getItem: () => stored,
      removeItem: () => undefined
    },
    document: {
      documentElement: { classList }
    }
  });
  return [...classList.tokens];
};

describe("parseSeasonMessage", () => {
  it("reads a season sent by the extension", () => {
    expect(
      parseSeasonMessage({
        source: "Nowly",
        type: "SEASON",
        payload: { season: "halloween" }
      })
    ).toEqual({ season: "halloween" });
    expect(
      parseSeasonMessage({
        source: "Nowly",
        type: "SEASON",
        payload: { season: null }
      })
    ).toEqual({ season: null });
  });

  it("treats a season this site does not know yet as no season", () => {
    expect(
      parseSeasonMessage({
        source: "Nowly",
        type: "SEASON",
        payload: { season: "lunar-new-year" }
      })
    ).toEqual({ season: null });
  });

  it("ignores anything else", () => {
    expect(
      parseSeasonMessage({
        source: "Nowly",
        type: "EXT_DETECTED"
      })
    ).toBeNull();
    expect(
      parseSeasonMessage({
        source: "Other",
        type: "SEASON",
        payload: { season: "winter" }
      })
    ).toBeNull();
    expect(
      parseSeasonMessage({
        source: "Nowly",
        type: "SEASON"
      })
    ).toBeNull();
    expect(
      parseSeasonMessage({
        source: "Nowly",
        type: "SEASON",
        payload: { season: 3 }
      })
    ).toBeNull();
    expect(parseSeasonMessage("SEASON")).toBeNull();
  });
});

describe("parseSeasonPreview", () => {
  it("only accepts known seasons and none", () => {
    expect(parseSeasonPreview("?season=winter")).toBe("winter");
    expect(parseSeasonPreview("?season=none")).toBe("none");
    expect(parseSeasonPreview("?season=easter")).toBeNull();
    expect(parseSeasonPreview("")).toBeNull();
  });
});

describe("season state", () => {
  const initial: SeasonState = {
    season: null,
    source: "none"
  };

  it("starts without any seasonal colours or decor unless explicitly previewing", () => {
    expect(initialSeasonState({ preview: null })).toEqual({
      season: null,
      source: "none"
    });
    expect(initialSeasonState({ preview: "winter" })).toEqual({
      season: "winter",
      source: "preview"
    });
    expect(initialSeasonState({ preview: "none" })).toEqual({
      season: null,
      source: "preview"
    });
  });

  it("is confirmed, changed or removed by the extension", () => {
    expect(
      nextSeasonState(initial, {
        type: "extension",
        season: "halloween"
      })
    ).toEqual({
      season: "halloween",
      source: "extension"
    });
    expect(
      nextSeasonState(initial, {
        type: "extension",
        season: null
      })
    ).toEqual({
      season: null,
      source: "extension"
    });
    expect(
      nextSeasonState(initial, {
        type: "extension",
        season: "winter"
      })
    ).toEqual({
      season: "winter",
      source: "extension"
    });
  });

  it("is removed when the extension stays silent", () => {
    expect(nextSeasonState(initial, { type: "timeout" })).toEqual({
      season: null,
      source: "none"
    });
    const answered: SeasonState = {
      season: "autumn",
      source: "extension"
    };
    expect(nextSeasonState(answered, { type: "timeout" })).toBe(answered);
  });

  it("keeps a preview whatever happens", () => {
    const preview: SeasonState = {
      season: "spring",
      source: "preview"
    };
    expect(nextSeasonState(preview, { type: "request" })).toBe(preview);
    expect(
      nextSeasonState(preview, {
        type: "extension",
        season: null
      })
    ).toBe(preview);
    expect(nextSeasonState(preview, { type: "timeout" })).toBe(preview);
  });

  it("waits for a fresh answer when the tab becomes visible again", () => {
    const confirmed: SeasonState = {
      season: "winter",
      source: "extension"
    };
    const pending = nextSeasonState(confirmed, { type: "request" });
    expect(pending).toEqual({
      season: null,
      source: "pending"
    });
    expect(
      nextSeasonState(pending, {
        type: "extension",
        season: "winter"
      }).season
    ).toBe("winter");
    expect(
      nextSeasonState(pending, {
        type: "extension",
        season: null
      }).season
    ).toBeNull();
  });

  it("clears a previously confirmed season if the extension no longer answers", () => {
    const pending = nextSeasonState(
      {
        season: "winter",
        source: "extension"
      },
      { type: "request" }
    );
    const expired = nextSeasonState(pending, { type: "timeout" });
    expect(expired).toEqual({
      season: null,
      source: "none"
    });
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
  it("never restores any remembered seasonal colours or decor before the first paint", () => {
    for (const stored of SITE_SEASONS) {
      expect(
        runBoot({
          allowPreview: false,
          stored
        })
      ).toEqual(["font"]);
    }

    expect(
      runBoot({
        allowPreview: false,
        stored: "bogus"
      })
    ).toEqual(["font"]);
    expect(runBoot({ allowPreview: false })).toEqual(["font"]);
  });

  it("removes stale classes without touching the base theme", () => {
    expect(
      runBoot({
        allowPreview: false,
        initial: ["font", "dark", "season-winter", "season-spring", "season-leaving"]
      })
    ).toEqual(["font", "dark"]);
  });

  it("clears the obsolete season cache without reading it", () => {
    const removed: string[] = [];
    runInNewContext(seasonBootScript(false), {
      localStorage: {
        getItem: () => {
          throw new Error("must not restore the cache");
        },
        removeItem: (key: string) => removed.push(key)
      },
      document: {
        documentElement: { classList: fakeClassList() }
      }
    });
    expect(removed).toEqual([SEASON_STORAGE_KEY]);
  });

  it("honours the preview parameter only when allowed", () => {
    expect(
      runBoot({
        allowPreview: true,
        search: "?season=winter",
        stored: "halloween"
      })
    ).toEqual(["font", "season-winter"]);
    expect(
      runBoot({
        allowPreview: true,
        search: "?season=none",
        stored: "halloween"
      })
    ).toEqual(["font"]);
    expect(
      runBoot({
        allowPreview: false,
        search: "?season=winter"
      })
    ).toEqual(["font"]);
  });

  it("survives a blocked storage", () => {
    const classList = fakeClassList();
    const context = {
      URLSearchParams,
      location: { search: "" },
      localStorage: {
        removeItem: () => {
          throw new Error("blocked");
        }
      },
      document: {
        documentElement: { classList }
      }
    };
    expect(() => runInNewContext(seasonBootScript(false), context)).not.toThrow();
    expect(classList.tokens.size).toBe(0);
    runInNewContext(seasonBootScript(true), {
      ...context,
      location: { search: "?season=winter" }
    });
    expect([...classList.tokens]).toEqual(["season-winter"]);
  });
});