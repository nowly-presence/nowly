import { announcement } from "@nowly/database/schema/announcement";
import { ANNOUNCEMENT_LOCALES, AnnouncementSchema, selectAnnouncementTranslation } from "@nowly/shared/announcements";
import { Hono } from "hono";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createAnnouncementsRoutes } from "@/features/announcements/announcements.routes";
import { createTestDatabase, type TestDatabase } from "./database";
import { inject, mount } from "./http";

vi.mock("@nowly/env/server", () => ({
  serverEnv: {}
}));
vi.mock("@/features/announcements/announcements.changelog", () => ({
  readReleaseAnnouncements: async () => []
}));

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase();
});
afterAll(() => database.close());

const storedAnnouncements = () => database.db.select().from(announcement);

const input = {
  translations: {
    fr: {
      title: "Maintenance",
      description: "La bibliothèque est en cours de mise à jour."
    }
  },
  kind: "maintenance",
  pinned: true
};

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "public-post",
  translations: input.translations,
  kind: "maintenance",
  pinned: true,
  severity: null,
  startsAt: null,
  endsAt: null,
  expiresAt: null,
  publishedAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  ...overrides
});

describe("announcements API", () => {
  let server: Pick<Hono, "request">;
  const seed = (...rows: Array<ReturnType<typeof row>>) => database.db.insert(announcement).values(rows);
  beforeEach(async () => {
    vi.stubEnv("API_SECRET_KEY", "announcements-test-placeholder");
    await database.reset();
    server = mount("/announcements", createAnnouncementsRoutes());
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it.each(["development", "production"])("fails closed without a configured secret in %s", async (environment) => {
    vi.stubEnv("NODE_ENV", environment);
    vi.stubEnv("API_SECRET_KEY", "");

    for (const authorization of [undefined, "Bearer announcements-test-placeholder", "Bearer "]) {
      const result = await inject(server, {
        method: "POST",
        url: "/announcements",
        headers: authorization ? { authorization } : {},
        payload: input
      });
      expect(result.statusCode).toBe(401);
    }

    expect(await storedAnnouncements()).toEqual([]);
  });

  it.each(["development", "production"])("rejects missing and wrong bearer keys in %s", async (environment) => {
    vi.stubEnv("NODE_ENV", environment);

    for (const authorization of [undefined, "Bearer incorrect", "Basic announcements-test-placeholder"]) {
      expect(
        (
          await inject(server, {
            method: "POST",
            url: "/announcements",
            headers: authorization ? { authorization } : {},
            payload: input
          })
        ).statusCode
      ).toBe(401);
    }
  });

  const post = (payload: unknown) =>
    inject(server, {
      method: "POST",
      url: "/announcements",
      payload: JSON.stringify(payload),
      headers: {
        authorization: "Bearer announcements-test-placeholder",
        "content-type": "application/json"
      }
    });

  it("persists a single translation and returns a validated public DTO", async () => {
    const result = await post(input);
    expect(result.statusCode).toBe(201);
    expect(AnnouncementSchema.safeParse(result.json()).success).toBe(true);
    expect(result.json().translations).toEqual({
      fr: {
        ...input.translations.fr,
        content: ""
      }
    });
    const [stored] = await storedAnnouncements();
    expect(stored).toMatchObject({
      kind: "maintenance",
      pinned: true,
      translations: {
        fr: {
          ...input.translations.fr,
          content: ""
        }
      }
    });
    expect(result.body).not.toContain("announcements-test-placeholder");
  });

  it("accepts all supported UI languages without requiring English", async () => {
    const translations = Object.fromEntries(
      ANNOUNCEMENT_LOCALES.map((locale) => [
        locale,
        {
          title: "News",
          description: "Published notice",
          content: "**Safe text**"
        }
      ])
    );
    expect((await post({ ...input, translations })).statusCode).toBe(201);
  });

  it.each([
    {
      translations: {}
    },
    {
      translations: {
        xx: {
          title: "x",
          description: "x"
        }
      }
    },
    {
      translations: {
        "en-US": {
          title: "x",
          description: "x"
        }
      }
    },
    {
      translations: {
        en: {
          title: " ",
          description: "x"
        }
      }
    },
    {
      translations: {
        en: {
          title: "x",
          description: ""
        }
      }
    },
    {
      translations: {
        en: {
          title: "x",
          description: "x",
          content: 1
        }
      }
    },
    {
      translations: {
        en: {
          title: "x".repeat(161),
          description: "x"
        }
      }
    },
    {
      translations: {
        en: {
          title: "x",
          description: "x",
          content: "x".repeat(20_001)
        }
      }
    },
    {
      kind: "warning",
      severity: null
    },
    {
      kind: "warning",
      severity: 4
    },
    {
      kind: "maintenance",
      severity: 1
    },
    { kind: "unknown" },
    { pinned: "true" },
    { startsAt: "invalid" },
    {
      startsAt: "2027-01-02T00:00:00Z",
      endsAt: "2027-01-01T00:00:00Z"
    },
    {
      endsAt: "2027-01-02T00:00:00Z",
      expiresAt: "2027-01-01T00:00:00Z"
    },
    { privateNote: "not public" }
  ])("rejects invalid input %#", async (override) => {
    expect((await post({ ...input, ...override })).statusCode).toBe(400);
    expect(await storedAnnouncements()).toEqual([]);
  });

  it("bounds request bodies", async () => {
    expect(
      (
        await post({
          ...input,
          content: "x".repeat(131_073)
        })
      ).statusCode
    ).toBe(413);
  });

  it("preserves parsing and size errors even with a generic parent error handler", async () => {
    server = new Hono().onError((_error, c) => c.json({ error: "INTERNAL_SERVER_ERROR" }, 500)).route("/announcements", createAnnouncementsRoutes());
    expect(
      (
        await post({
          ...input,
          content: "x".repeat(131_073)
        })
      ).statusCode
    ).toBe(413);
    const invalid = await inject(server, {
      method: "POST",
      url: "/announcements",
      headers: {
        authorization: "Bearer announcements-test-placeholder",
        "content-type": "application/json"
      },
      payload: "{not json"
    });
    expect(invalid.statusCode).toBe(400);
  });

  it("returns only visible posts and queries with bounded explicit public fields", async () => {
    await seed(
      ...[
        row(),
        row({
          id: "future",
          startsAt: new Date("2999-01-01")
        }),
        row({
          id: "unpublished",
          publishedAt: new Date("2999-01-01")
        }),
        row({
          id: "ended",
          endsAt: new Date("2000-01-01")
        }),
        row({
          id: "expired",
          expiresAt: new Date("2000-01-01")
        })
      ]
    );
    const result = await inject(server, { url: "/announcements?locale=fr" });
    expect(result.statusCode).toBe(200);
    expect(
      result
        .json()
        .items.map((item: { id: string }) => item.id)
        .sort()
    ).toEqual(["ended", "public-post"]);
    expect((await inject(server, { url: "/announcements?locale=../secret" })).statusCode).toBe(400);
  });

  it.each([-1, 0, 1])("keeps a notice in fresh public feeds at estimated-end offset %i ms", async (offset) => {
    const end = new Date("2026-10-24T12:00:00Z");
    vi.useFakeTimers({
      toFake: ["Date"]
    });
    vi.setSystemTime(end.getTime() + offset);
    await seed(row({ endsAt: end }));
    const response = await inject(server, { url: "/announcements?locale=fr" });
    expect(response.statusCode).toBe(200);
    expect(response.json().items.map((item: { id: string }) => item.id)).toEqual(["public-post"]);
    expect(response.json().items[0]).toMatchObject({
      pinned: true,
      endsAt: end.toISOString(),
      expiresAt: null
    });
    expect(await storedAnnouncements()).toHaveLength(1);
  });

  it.each([-1, 0, 1])("still honors explicit feed expiry at offset %i ms independently of estimated end", async (offset) => {
    const expiry = new Date("2026-10-24T13:00:00Z");
    vi.useFakeTimers({
      toFake: ["Date"]
    });
    vi.setSystemTime(expiry.getTime() + offset);
    await seed(
      row({
        endsAt: new Date("2026-10-24T12:00:00Z"),
        expiresAt: expiry
      })
    );
    const response = await inject(server, { url: "/announcements?locale=fr" });
    expect(response.statusCode).toBe(200);
    expect(response.json().items.map((item: { id: string }) => item.id)).toEqual(offset < 0 ? ["public-post"] : []);
  });

  it("selects requested locale, English, then deterministic supported-locale order", () => {
    const translations = {
      fr: {
        title: "FR",
        description: "FR",
        content: ""
      },
      de: {
        title: "DE",
        description: "DE",
        content: ""
      }
    };
    expect(selectAnnouncementTranslation({ translations }, "de")?.title).toBe("DE");
    expect(selectAnnouncementTranslation({ translations }, "ja")?.title).toBe("FR");
    expect(
      selectAnnouncementTranslation(
        {
          translations: {
            ...translations,
            en: {
              title: "EN",
              description: "EN",
              content: ""
            }
          }
        },
        "ja"
      )?.title
    ).toBe("EN");
  });

  it("streams bounded invalidations and releases the client when the stream is cancelled", async () => {
    const response = await server.request("http://localhost/announcements/events");
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    const first = await reader?.read();
    expect(new TextDecoder().decode(first?.value)).toContain("event: invalidate\ndata: {}");
    await post(input);
    const next = await reader?.read();
    expect(new TextDecoder().decode(next?.value)).toBe("event: invalidate\ndata: {}\n\n");
    await reader?.cancel();
  });
});