import { describe, expect, it } from "vitest";
import { buildPreviewActivity, fillTemplate, findPage, matchesPage, mediaTimestamps } from "./creator-activity";
import { generatePresenceSource, generateSettingsSource } from "./creator-codegen";
import { buildTextFiles } from "./creator-export";
import { createPage, isValidDomain, normalizeDomain, normalizeDraft, presenceFolder, presenceSlug, toIdentifier } from "./creator-draft";
import { buildLocaleFiles, buildMetadata, pageKeys } from "./creator-files";
import { sampleCreatorDraft } from "./creator-fixtures";
import { validateDraft } from "./creator-validation";
import { diffDefinitions } from "./creator-diff";
import { parseCreatorDefinition } from "./creator-schema";

describe("creator naming", () => {
  it("derives slug, folder and identifiers like the presences repo", () => {
    expect(presenceSlug("Example Tube")).toBe("example-tube");
    expect(presenceFolder("example tube")).toBe("src/E/example tube");
    expect(toIdentifier("Titre de la vidéo")).toBe("titreDeLaVideo");
    expect(toIdentifier("2nd line")).toBe("v2ndLine");
    expect(toIdentifier("videoId")).toBe("videoId");
    expect(toIdentifier("TITLE")).toBe("title");
  });

  it("normalizes domains typed as URLs", () => {
    expect(normalizeDomain("https://www.Example.com/watch?v=1")).toBe("example.com");
    expect(normalizeDomain("music.example.com")).toBe("music.example.com");
    expect(isValidDomain("example.com")).toBe(true);
    expect(isValidDomain("localhost")).toBe(false);
  });
});

describe("creator pages", () => {
  it("matches pages by path mode", () => {
    const page = createPage("Watch", "/watch");
    expect(matchesPage(page, "/watch")).toBe(true);
    expect(matchesPage(page, "/watch/123")).toBe(true);
    expect(
      matchesPage(
        {
          ...page,
          match: {
            mode: "equals",
            path: "/watch/"
          }
        },
        "/watch"
      )
    ).toBe(true);
    expect(
      matchesPage(
        {
          ...page,
          match: {
            mode: "contains",
            path: "video"
          }
        },
        "/a/video/b"
      )
    ).toBe(true);
    expect(matchesPage(page, "/home")).toBe(false);
    expect(findPage(sampleCreatorDraft().pages, "https://example.com/results?q=a")?.name).toBe("Search");
  });

  it("fills templates and drops unknown tokens", () => {
    expect(fillTemplate("Watching {title} by {channel}", { title: "A" })).toBe("Watching A by");
  });

  it("builds the preview activity from extracted values", () => {
    const draft = sampleCreatorDraft();
    const [watch] = draft.pages;
    const extraction = {
      url: "https://example.com/watch",
      values: watch.variables.map((variable) => ({
        variableId: variable.id,
        value: variable.sample
      })),
      media: {
        currentTime: 30,
        duration: 90,
        paused: false
      }
    };
    const preview = buildPreviewActivity(draft, watch, extraction, "fr-FR", {
      nowMs: 100_000,
      startedAtMs: 0,
      pageUrl: "https://example.com/watch"
    });
    expect(preview.activity.details).toBe("Regarde Lo-fi beats");
    expect(preview.activity.state).toBe("par Nowly Radio");
    expect(preview.activity.startTimestamp).toBe(70);
    expect(preview.activity.endTimestamp).toBe(160);
    expect(preview.activity.buttons).toEqual([
      {
        label: "Voir la vidéo",
        url: "https://example.com/v/abc123"
      }
    ]);
    expect(preview.largeImage).toBe("https://img.example.com/poster.jpg");
    expect(
      mediaTimestamps(
        {
          currentTime: 1,
          duration: 2,
          paused: true
        },
        0
      )
    ).toEqual({});
  });

  it("resolves button links and custom images, skipping them when a value is missing", () => {
    const draft = sampleCreatorDraft();
    const [watch] = draft.pages;
    const page = {
      ...watch,
      largeImage: {
        kind: "custom" as const,
        template: "https://img.example.com/{videoId}.jpg"
      },
      buttons: [
        {
          ...watch.buttons[0],
          link: { kind: "page" as const }
        }
      ]
    };
    const options = {
      nowMs: 0,
      startedAtMs: 0,
      pageUrl: "https://example.com/watch"
    };
    const full = buildPreviewActivity(
      draft,
      page,
      {
        url: options.pageUrl,
        values: watch.variables.map((variable) => ({
          variableId: variable.id,
          value: variable.sample
        }))
      },
      "en-US",
      options
    );
    expect(full.largeImage).toBe("https://img.example.com/abc123.jpg");
    expect(full.activity.buttons?.[0].url).toBe("https://example.com/watch");
    const empty = buildPreviewActivity(
      draft,
      page,
      {
        url: options.pageUrl,
        values: []
      },
      "en-US",
      options
    );
    expect(empty.largeImage).toBeUndefined();
  });

  it("upgrades drafts saved before timestamps and button links changed", () => {
    const draft = sampleCreatorDraft();
    const legacyPage = {
      ...draft.pages[1],
      timestamps: "none",
      buttons: undefined,
      button: {
        enabled: true,
        label: { "en-US": "Open" }
      }
    } as unknown as (typeof draft.pages)[number];
    const upgraded = normalizeDraft({
      ...draft,
      pages: [legacyPage],
      features: Array.from({ length: 8 }, () => ({}))
    });
    expect(upgraded.pages[0].timestamps).toBe("elapsed");
    expect(upgraded.pages[0].buttons).toHaveLength(1);
    expect(upgraded.pages[0].buttons[0].link).toEqual({ kind: "page" });
    expect(upgraded.pages[0].buttons[0].label).toEqual({ "en-US": "Open" });
    expect(upgraded.features).toHaveLength(5);
  });
});

describe("creator files", () => {
  it("builds metadata in the repo schema", () => {
    const metadata = buildMetadata(sampleCreatorDraft());
    expect(metadata).toMatchObject({
      name: "Example Tube",
      url: ["example.com"],
      color: "#ff0033",
      category: "video",
      author: {
        name: "Gaëtan H",
        github: "steellgold"
      }
    });
    expect(metadata).toHaveProperty("description.en-US");
    expect(metadata).toHaveProperty("features.fr-FR", ["Détecte la vidéo en cours"]);
    expect(metadata).not.toHaveProperty("slug");
  });

  it("keeps the same keys in every locale file", () => {
    const files = buildLocaleFiles(sampleCreatorDraft());
    expect(Object.keys(files)).toEqual(["en-US", "fr-FR"]);
    expect(Object.keys(files["en-US"])).toEqual(Object.keys(files["fr-FR"]));
    expect(files["fr-FR"]).toMatchObject({
      watchDetails: "Regarde {title}",
      watchButton: "Voir la vidéo",
      browsing: "Navigue"
    });
  });

  it("deduplicates page keys", () => {
    expect(
      pageKeys([
        createPage("Watch"),
        createPage("Watch"),
        createPage("")
      ])
    ).toEqual(["watch", "watch2", "page3"]);
  });

  it("generates a stable presence script that follows the SDK conventions", () => {
    const source = generatePresenceSource(sampleCreatorDraft());
    expect(source).toMatchSnapshot();
    expect(source).not.toMatch(/;\s*$/m);
    expect(source).not.toMatch(/from '/);
  });

  it("keeps settings in settings.ts and out of presence.ts", () => {
    const draft = sampleCreatorDraft();
    const source = generatePresenceSource(draft);
    const settings = generateSettingsSource(draft);
    expect(settings).toMatchSnapshot();
    expect(source).not.toContain("Presence.Settings");
    expect(source).not.toContain("new Presence(settings)");
    expect(buildTextFiles(draft).some((file) => file.path.endsWith("/settings.ts"))).toBe(true);
  });

  it("writes no settings.ts when the presence has no setting", () => {
    const draft = {
      ...sampleCreatorDraft(),
      browsingFallback: false,
      pages: sampleCreatorDraft().pages.map((page) => ({
        ...page,
        buttons: []
      }))
    };
    expect(generateSettingsSource(draft)).toBeNull();
    expect(buildTextFiles(draft).some((file) => file.path.endsWith("/settings.ts"))).toBe(false);
    expect(generatePresenceSource(draft)).toContain('presence.on("UpdateData", async () => {');
  });
});

describe("creator validation", () => {
  it("accepts a complete draft", () => {
    expect(validateDraft(sampleCreatorDraft())).toEqual([]);
  });

  it("reports issues per step", () => {
    const draft = sampleCreatorDraft();
    const broken = {
      ...draft,
      name: "Example Tube",
      assets: {
        ...draft.assets,
        iconTransparent: false
      },
      locales: ["fr-FR" as const],
      baseLocale: "fr-FR" as const,
      pages: [
        {
          ...draft.pages[1],
          match: {
            mode: "any" as const,
            path: ""
          }
        },
        draft.pages[0]
      ]
    };
    const codes = validateDraft(broken, new Set(["example-tube"])).map((issue) => issue.code);
    expect(codes).toEqual(expect.arrayContaining(["iconOpaque", "nameTaken", "englishRequired", "pageCatchAllNotLast"]));
  });

  it("flags template variables that do not exist", () => {
    const draft = sampleCreatorDraft();
    const [watch, search] = draft.pages;
    const issues = validateDraft({
      ...draft,
      pages: [
        {
          ...watch,
          details: {
            "en-US": "Watching {movie}",
            "fr-FR": "Regarde {movie}"
          }
        },
        search
      ]
    });
    expect(issues).toContainEqual({
      step: "pages",
      code: "pageUnknownVariable",
      page: "Watch",
      locale: "en-US",
      detail: "movie"
    });
  });

  it("requires custom links and images to be https addresses", () => {
    const draft = sampleCreatorDraft();
    const [watch, search] = draft.pages;
    const page = {
      ...watch,
      largeImage: {
        kind: "custom" as const,
        template: "img/{videoId}.jpg"
      },
      buttons: [
        {
          ...watch.buttons[0],
          link: {
            kind: "custom" as const,
            template: "http://example.com/{nope}"
          }
        }
      ]
    };
    const codes = validateDraft({
      ...draft,
      pages: [page, search]
    }).map((issue) => `${issue.code}:${issue.detail ?? ""}`);
    expect(codes).toEqual(expect.arrayContaining(["pageButtonUrlInvalid:", "pageImageUrlInvalid:", "pageUnknownVariable:nope"]));
  });
});
describe("creator buttons", () => {
  const twoButtons = () => {
    const draft = sampleCreatorDraft();
    const [watch, ...rest] = draft.pages;
    const second = {
      id: "b2",
      label: {
        "en-US": "Channel",
        "fr-FR": "Chaîne"
      },
      link: { kind: "page" as const }
    };
    return {
      ...draft,
      pages: [
        {
          ...watch,
          buttons: [...watch.buttons, second]
        },
        ...rest
      ]
    };
  };

  it("writes one string per button and generates both in the presence", () => {
    const draft = twoButtons();
    const files = buildTextFiles(draft);
    const locale = files.find((file) => file.path.endsWith("/locales/en-US.json"));
    expect(locale?.content).toContain("watchButton2");
    const source = generatePresenceSource(draft);
    expect(source).toContain("buttons.push({ label: strings.watchButton2, url: pageUrl })");
    expect(source).toContain("if (buttons.length > 0) data.buttons = buttons");
  });

  it("previews both buttons", () => {
    const draft = twoButtons();
    const [page] = draft.pages;
    const preview = buildPreviewActivity(
      draft,
      page,
      {
        url: "https://example.com/watch",
        values: page.variables.map((variable) => ({
          variableId: variable.id,
          value: variable.sample
        }))
      },
      "en-US",
      {
        nowMs: 0,
        startedAtMs: 0,
        pageUrl: "https://example.com/watch"
      }
    );
    expect(preview.activity.buttons?.map((button) => button.label)).toEqual(["Watch video", "Channel"]);
  });

  it("accepts definitions sent with the single button shape", () => {
    const { assets: _assets, submission: _submission, ...definition } = twoButtons();
    const [page] = definition.pages;
    const { buttons, ...rest } = page;
    const legacy = {
      ...definition,
      pages: [
        {
          ...rest,
          button: {
            enabled: true,
            label: buttons[0].label,
            link: buttons[0].link
          }
        }
      ]
    };
    expect(parseCreatorDefinition(legacy)?.pages[0].buttons).toHaveLength(1);
  });
});

describe("creator definition schema and diff", () => {
  const definitionOf = () => {
    const { assets: _assets, submission: _submission, ...definition } = sampleCreatorDraft();
    return definition;
  };

  it("accepts the sample definition and strips unknown fields", () => {
    const parsed = parseCreatorDefinition({
      ...definitionOf(),
      code: "alert(1)"
    });
    expect(parsed).not.toBeNull();
    expect(parsed).not.toHaveProperty("code");
  });

  it("rejects control characters, long selectors and bad variable names", () => {
    const base = definitionOf();
    expect(
      parseCreatorDefinition({
        ...base,
        name: "Bad\u0007name"
      })
    ).toBeNull();
    const page = base.pages[0];
    expect(
      parseCreatorDefinition({
        ...base,
        pages: [
          {
            ...page,
            variables: [
              {
                ...page.variables[0],
                source: {
                  kind: "element",
                  selector: "a".repeat(301),
                  read: "text"
                }
              }
            ]
          }
        ]
      })
    ).toBeNull();
    expect(
      parseCreatorDefinition({
        ...base,
        pages: [
          {
            ...page,
            variables: [
              {
                ...page.variables[0],
                name: "Bad-Name"
              }
            ]
          }
        ]
      })
    ).toBeNull();
  });

  it("lists changed fields and pages by name", () => {
    const before = definitionOf();
    const after = {
      ...before,
      description: {
        ...before.description,
        "en-US": "Changed"
      },
      pages: [
        {
          ...before.pages[0],
          details: { "en-US": "New first line" }
        },
        ...before.pages.slice(1)
      ]
    };
    expect(diffDefinitions(before, after)).toEqual([
      {
        field: "description",
        kind: "changed"
      },
      {
        field: "page.details",
        page: before.pages[0].name,
        kind: "changed"
      }
    ]);
    expect(diffDefinitions(null, after)).toEqual([
      {
        field: "definition",
        kind: "added"
      }
    ]);
    expect(
      diffDefinitions(before, {
        ...before,
        pages: before.pages.slice(1)
      })[0]
    ).toEqual({
      field: "page",
      page: before.pages[0].name,
      kind: "removed"
    });
  });
});