import { afterEach, describe, expect, it, vi } from "vitest";
import { getPresenceBySlug, getPresenceCatalog } from "./presence-api";

vi.mock("server-only", () => ({}));

const row = (slug: string, overrides: Record<string, unknown> = {}) => ({
  slug,
  name: slug,
  category: "video",
  color: "#FF0033",
  description: { "en-US": `${slug} description` },
  url: [`${slug}.com`],
  author: {
    name: "Author",
    github: "@author"
  },
  totalInstalls: 0,
  ...overrides
});

const serveCatalog = (body: unknown, init?: ResponseInit) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(body, init))
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getPresenceCatalog", () => {
  it("drops rows without a slug and normalizes the rest with safe defaults", async () => {
    serveCatalog([
      { name: "No slug" },
      "not an object",
      row("YouTube ", {
        name: { "en-US": "YouTube" },
        category: "creator",
        color: "  ",
        description: { "fr-FR": "Regardez des vidéos" },
        url: "youtube.com",
        author: "Nowly",
        aliases: ["YT", "youtube", 42, " "]
      })
    ]);

    const [presence, ...rest] = await getPresenceCatalog();

    expect(rest).toEqual([]);
    expect(presence).toMatchObject({
      slug: "youtube",
      aliases: ["yt"],
      name: "YouTube",
      category: "other",
      color: "#111111",
      urls: ["youtube.com"],
      author: { name: "Nowly" },
      locales: ["fr-FR"],
      discordNative: false,
      version: null,
      lastUpdated: null
    });
    expect(presence.description["en-US"]).toBe("Regardez des vidéos");
  });

  it("orders presences by installs, then by name", async () => {
    serveCatalog([
      row("b", { totalInstalls: 5 }),
      row("c", { totalInstalls: 9 }),
      row("a", { totalInstalls: 5 })
    ]);

    expect((await getPresenceCatalog()).map((presence) => presence.slug)).toEqual(["c", "a", "b"]);
  });

  it("returns an empty catalog when the API fails or answers something else than a list", async () => {
    serveCatalog({ error: "INTERNAL" }, { status: 500 });
    await expect(getPresenceCatalog()).resolves.toEqual([]);

    serveCatalog({
      presences: []
    });
    await expect(getPresenceCatalog()).resolves.toEqual([]);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(getPresenceCatalog()).resolves.toEqual([]);
  });
});

describe("getPresenceBySlug", () => {
  it("resolves slugs case-insensitively, then aliases, and never lets an alias shadow a slug", async () => {
    serveCatalog([
      row("openfront.io", {
        aliases: ["openfront", "youtube"]
      }),
      row("youtube")
    ]);

    expect((await getPresenceBySlug("OpenFront.io"))?.slug).toBe("openfront.io");
    expect((await getPresenceBySlug(" openfront "))?.slug).toBe("openfront.io");
    expect((await getPresenceBySlug("youtube"))?.slug).toBe("youtube");
    await expect(getPresenceBySlug("unknown")).resolves.toBeNull();
  });
});