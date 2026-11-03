import { unzipSync, strFromU8 } from "fflate";
import { describe, expect, it } from "vitest";
import { buildPreviewActivity, fillTemplate, findPage, matchesPage, mediaTimestamps } from "@/shared/creator/creator-activity";
import { generatePresenceSource } from "@/shared/creator/creator-codegen";
import { createPage, isValidDomain, normalizeDomain, normalizeDraft, presenceFolder, presenceSlug, toIdentifier } from "@/shared/creator/creator-draft";
import { buildCreatorZip } from "@/shared/creator/creator-export";
import { buildLocaleFiles, buildMetadata, pageKeys } from "@/shared/creator/creator-files";
import { sampleCreatorDraft } from "@/shared/creator/creator-fixtures";
import { validateDraft } from "@/shared/creator/creator-validation";

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
      button: {
        ...watch.button,
        link: { kind: "page" as const }
      }
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
      button: {
        enabled: false,
        label: {}
      }
    } as unknown as (typeof draft.pages)[number];
    const upgraded = normalizeDraft({
      ...draft,
      pages: [legacyPage],
      features: Array.from({ length: 8 }, () => ({}))
    });
    expect(upgraded.pages[0].timestamps).toBe("elapsed");
    expect(upgraded.pages[0].button.link).toEqual({ kind: "page" });
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

  it("generates a presence script that follows the SDK conventions", () => {
    const source = generatePresenceSource(sampleCreatorDraft());
    expect(source).toContain('import { createMediaTimestamps, PresenceType, type PresenceData } from "@nowly/sdk"');
    expect(source).toContain('import type baseStrings from "./locales/en-US.json"');
    expect(source).toContain('if (pathname.startsWith("/watch")) {');
    expect(source).toContain("presence.formatString(strings.watchDetails, { title })");
    expect(source).toContain('presence.formatString(strings.watchState, { channel: channel ?? "" })');
    expect(source).toContain("largeImageKey: poster ?? Assets.Logo,");
    expect(source).toContain("if (showButtons && videoId) data.buttons = [{ label: strings.watchButton, url: `https://example.com/v/${videoId}` }]");
    expect(source).toContain("data.startTimestamp = pageStartedAt");
    expect(source).toContain("presence.clearActivity()");
    expect(source).not.toMatch(/;\s*$/m);
    expect(source).not.toMatch(/from '/);
  });

  it("exports a zip with the presences repo layout", () => {
    const entries = unzipSync(buildCreatorZip(sampleCreatorDraft()));
    expect(Object.keys(entries).sort()).toEqual([
      "creator.json",
      "src/E/Example Tube/assets/icon.png",
      "src/E/Example Tube/assets/logo.png",
      "src/E/Example Tube/assets/thumbnail.jpg",
      "src/E/Example Tube/locales/en-US.json",
      "src/E/Example Tube/locales/fr-FR.json",
      "src/E/Example Tube/metadata.json",
      "src/E/Example Tube/presence.ts"
    ]);
    expect(JSON.parse(strFromU8(entries["creator.json"]))).not.toHaveProperty("assets");
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
      button: {
        ...watch.button,
        link: {
          kind: "custom" as const,
          template: "http://example.com/{nope}"
        }
      }
    };
    const codes = validateDraft({
      ...draft,
      pages: [page, search]
    }).map((issue) => `${issue.code}:${issue.detail ?? ""}`);
    expect(codes).toEqual(expect.arrayContaining(["pageButtonUrlInvalid:", "pageImageUrlInvalid:", "pageUnknownVariable:nope"]));
  });
});