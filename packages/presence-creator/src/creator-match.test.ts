import { describe, expect, it } from "vitest";
import { matchesPage } from "./creator-activity";
import { generatePresenceSource } from "./creator-codegen";
import { createPage, normalizeDraft } from "./creator-draft";
import { sampleCreatorDraft } from "./creator-fixtures";
import type { CreatorPage } from "./creator-types";

describe("page address groups", () => {
  const grouped = (mode: CreatorPage["match"]["mode"]): CreatorPage => ({
    ...createPage("Details", "/movie/"),
    match: {
      mode,
      path: "/movie/",
      extraPaths: ["tv/", " ", "/game/"]
    }
  });

  it("matches any of the page addresses", () => {
    const page = grouped("startsWith");
    expect(matchesPage(page, "/movie/42")).toBe(true);
    expect(matchesPage(page, "/tv/7")).toBe(true);
    expect(matchesPage(page, "/game/1")).toBe(true);
    expect(matchesPage(page, "/music/1")).toBe(false);
  });

  it("generates one check per address", () => {
    const draft = {
      ...sampleCreatorDraft(),
      pages: [grouped("startsWith")]
    };
    const source = generatePresenceSource(draft);
    expect(source).toContain('if (pathname.startsWith("/movie/") || pathname.startsWith("/tv/") || pathname.startsWith("/game/")) {');
  });

  it("drops a missing address list from older drafts", () => {
    const page = createPage("Old", "/watch");
    const { extraPaths: _, ...legacyMatch } = page.match;
    const draft = normalizeDraft({
      ...sampleCreatorDraft(),
      pages: [
        {
          ...page,
          match: legacyMatch as CreatorPage["match"]
        }
      ]
    });
    expect(draft.pages[0].match.extraPaths).toEqual([]);
  });
});