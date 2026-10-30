import { getPresenceAliasIssues, presenceAliases, PRESENCE_ALIASES_MAX } from "@nowly/shared";
import { describe, expect, it } from "vitest";

const presence = (slug: string, aliases?: unknown) => ({
  slug,
  metadata: aliases === undefined ? {} : { aliases }
});

describe("presence alias rules", () => {
  it("accepts presences without aliases and unique lowercase aliases", () => {
    const catalog = [
      presence("openfront.io", ["openfront", "open-front"]),
      presence("youtube", ["yt"])
    ];

    expect(getPresenceAliasIssues(presence("youtube"), catalog)).toEqual([]);
    expect(getPresenceAliasIssues(catalog[0], catalog)).toEqual([]);
  });

  it("rejects malformed lists and entries", () => {
    expect(getPresenceAliasIssues(presence("example", "example-site"), [])).toEqual(["metadata.aliases must be an array of strings"]);
    expect(
      getPresenceAliasIssues(
        presence("example", [
          "Example",
          "a b",
          "-x",
          "x.",
          "a".repeat(81),
          3
        ]),
        []
      )
    ).toEqual([
      'Alias "Example" must use lowercase letters, digits, dots or hyphens (max 80 characters)',
      'Alias "a b" must use lowercase letters, digits, dots or hyphens (max 80 characters)',
      'Alias "-x" must use lowercase letters, digits, dots or hyphens (max 80 characters)',
      'Alias "x." must use lowercase letters, digits, dots or hyphens (max 80 characters)',
      `Alias "${"a".repeat(81)}" must use lowercase letters, digits, dots or hyphens (max 80 characters)`,
      "metadata.aliases must only contain strings"
    ]);
    expect(
      getPresenceAliasIssues(
        presence(
          "example",
          Array.from({ length: PRESENCE_ALIASES_MAX + 1 }, (_, index) => `alias-${index}`)
        ),
        []
      )
    ).toEqual([`metadata.aliases accepts at most ${PRESENCE_ALIASES_MAX} entries`]);
  });

  it("rejects an alias repeating the presence slug or itself", () => {
    expect(getPresenceAliasIssues(presence("example", ["example", "ex", "ex"]), [])).toEqual([
      'Alias "example" duplicates the presence slug',
      'Alias "ex" is listed more than once'
    ]);
  });

  it("rejects collisions with another presence in both directions", () => {
    const catalog = [
      presence("youtube", ["yt"]),
      presence("openfront.io", ["openfront"])
    ];

    expect(getPresenceAliasIssues(presence("example", ["youtube", "yt"]), catalog)).toEqual([
      'Alias "youtube" is already the slug of "youtube"',
      'Alias "yt" is already an alias of "youtube"'
    ]);
    expect(getPresenceAliasIssues(presence("openfront"), catalog)).toEqual(['Slug "openfront" is already an alias of "openfront.io"']);
  });

  it("reads only usable aliases from stored metadata, lowercased", () => {
    expect(
      presenceAliases({
        aliases: [" YT ", "", 4, "music"]
      })
    ).toEqual(["yt", "music"]);
    expect(presenceAliases({ aliases: "yt" })).toEqual([]);
    expect(presenceAliases(null)).toEqual([]);
  });
});