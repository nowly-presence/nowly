import { announcement } from "@nowly/database/schema/announcement";
import { ANNOUNCEMENT_LOCALES } from "@nowly/shared/announcements";
import { Hono } from "hono";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createAnnouncementsRoutes } from "@/features/announcements/announcements.routes";
import { maskUrls, restoreUrls } from "@/features/announcements/announcements.translation";
import { createTestDatabase, type TestDatabase } from "./database";
import { inject, mount } from "./http";

const model = vi.hoisted(() => ({
  configured: true,
  run: vi.fn()
}));

vi.mock("@nowly/env/server", () => ({
  serverEnv: {}
}));
vi.mock("@/features/announcements/announcements.changelog", () => ({
  readReleaseAnnouncements: async () => []
}));
vi.mock("@/shared/workers-ai", () => ({
  hasWorkersAi: () => model.configured,
  runJsonModel: model.run
}));

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase();
});
afterAll(() => database.close());

const english = {
  title: "Library maintenance",
  description: "Saved activities keep working.",
  content: "See [status](https://nowly.me/status)."
};

const input = {
  translations: { en: english },
  kind: "normal"
};

describe("announcement translation", () => {
  let server: Pick<Hono, "request">;

  beforeEach(async () => {
    vi.stubEnv("API_SECRET_KEY", "announcements-test-placeholder");
    await database.reset();
    model.configured = true;
    model.run.mockReset();
    model.run.mockImplementation(
      async (messages: Array<{
        content: string;
      }>) => {
        const source = JSON.parse(messages[1].content) as typeof english;
        return {
          title: `T ${source.title}`,
          description: `T ${source.description}`,
          content: source.content
        };
      }
    );
    server = mount("/announcements", createAnnouncementsRoutes());
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

  it("translates every missing language by default and keeps the written English", async () => {
    const result = await post(input);
    expect(result.statusCode).toBe(201);
    expect(Object.keys(result.json().translations).sort()).toEqual([...ANNOUNCEMENT_LOCALES].sort());
    expect(result.json().translations.en).toEqual(english);
    expect(result.json().translations.fr.content).toBe(english.content);
    expect(model.run).toHaveBeenCalledTimes(ANNOUNCEMENT_LOCALES.length - 1);
  });

  it("sends English only when translation is turned off", async () => {
    const result = await post({
      ...input,
      translate: false
    });
    expect(result.statusCode).toBe(201);
    expect(Object.keys(result.json().translations)).toEqual(["en"]);
    expect(model.run).not.toHaveBeenCalled();
  });

  it("keeps a language written by hand", async () => {
    const result = await post({
      ...input,
      translations: {
        en: english,
        fr: {
          title: "Titre",
          description: "Description"
        }
      }
    });
    expect(result.json().translations.fr.title).toBe("Titre");
    expect(model.run).toHaveBeenCalledTimes(ANNOUNCEMENT_LOCALES.length - 2);
  });

  it("requires English as the source and a boolean flag", async () => {
    const withoutEnglish = await post({
      translations: {
        fr: {
          title: "Titre",
          description: "Description"
        }
      },
      kind: "normal"
    });
    expect(withoutEnglish.statusCode).toBe(400);
    expect(withoutEnglish.json()).toEqual({ error: "ENGLISH_REQUIRED" });
    expect(
      (
        await post({
          ...input,
          translate: "yes"
        })
      ).statusCode
    ).toBe(400);
  });

  it("publishes nothing when the model fails", async () => {
    model.run.mockRejectedValue(new Error("Workers AI answered 500"));
    const result = await post(input);
    expect(result.statusCode).toBe(502);
    expect(result.json()).toEqual({ error: "TRANSLATION_FAILED" });
    expect(await database.db.select().from(announcement)).toEqual([]);
  });

  it("refuses a translation that changes the links", async () => {
    model.run.mockResolvedValue({
      title: "T",
      description: "T",
      content: "See [status](https://evil.example/phish)."
    });
    expect((await post(input)).statusCode).toBe(502);
  });

  it("publishes the given languages as is when the model is not configured", async () => {
    model.configured = false;
    const result = await post(input);
    expect(result.statusCode).toBe(201);
    expect(Object.keys(result.json().translations)).toEqual(["en"]);
    expect(model.run).not.toHaveBeenCalled();
  });

  it("masks and restores URLs without letting new ones in", () => {
    const { masked, urls } = maskUrls("a https://nowly.me/x b");
    expect(masked).toBe("a {0} b");
    expect(restoreUrls("un {0} deux", urls, 100)).toBe("un https://nowly.me/x deux");
    expect(restoreUrls("un https://evil.example deux", urls, 100)).toBeNull();
  });
});