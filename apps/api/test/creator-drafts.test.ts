import { user } from "@nowly/database/schema/auth";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "@/app";
import { DEFAULT_BODY_LIMIT } from "@/middleware/body-limit";
import { resetRateLimits } from "@/middleware/rate-limit";
import { createTestDatabase, seedExtensionToken, seedUser, type TestDatabase } from "./database";
import { inject } from "./http";

const AUTHOR = "creator-drafts-author";
const OTHER = "creator-drafts-other";

let database: TestDatabase;
let headers: Record<string, string>;
let otherHeaders: Record<string, string>;

const app = createApp;

const draft = (id: string, updatedAt: number) => ({
  id,
  updatedAt,
  name: "Example"
});

const put = (id: string, updatedAt: number, value: unknown = draft(id, updatedAt), as = headers) =>
  inject(app(), {
    method: "PUT",
    url: `/me/creator-drafts/${id}`,
    headers: as,
    payload: { updatedAt, value }
  });

const index = async (as = headers) =>
  (
    await inject(app(), {
      url: "/me/creator-drafts",
      headers: as
    })
  ).json<{
    items: Array<{
      id: string;
      updatedAt: number;
      deleted: boolean;
    }>;
  }>().items;

beforeAll(async () => {
  database = await createTestDatabase();
});
beforeEach(async () => {
  resetRateLimits();
  await database.reset();

  for (const id of [AUTHOR, OTHER]) {
    await seedUser(database.db, id);
    await database.db
      .update(user)
      .set({ discordId: `${id}-discord` })
      .where(eq(user.id, id));
  }

  headers = {
    authorization: `Bearer ${await seedExtensionToken({
      userId: AUTHOR,
      scopes: ["creator"]
    })}`
  };
  otherHeaders = {
    authorization: `Bearer ${await seedExtensionToken({
      userId: OTHER,
      scopes: ["creator"]
    })}`
  };
});
afterAll(() => database.close());

describe("creator draft sync", () => {
  it("needs a creator token", async () => {
    expect((await inject(app(), { url: "/me/creator-drafts" })).statusCode).toBe(401);
  });

  it("stores a draft and returns it from another device", async () => {
    expect((await put("abcd1234", 100)).statusCode).toBe(200);
    expect(await index()).toEqual([
      {
        id: "abcd1234",
        updatedAt: 100,
        deleted: false
      }
    ]);

    const fetched = await inject(app(), {
      url: "/me/creator-drafts/abcd1234",
      headers
    });
    expect(fetched.json().value).toEqual(draft("abcd1234", 100));
    expect(
      (
        await inject(app(), {
          url: "/me/creator-drafts/abcd1234",
          headers: otherHeaders
        })
      ).statusCode
    ).toBe(404);
    expect(await index(otherHeaders)).toEqual([]);
  });

  it("accepts drafts larger than the API default cap", async () => {
    const value = {
      ...draft("abcd1234", 100),
      blob: "x".repeat(DEFAULT_BODY_LIMIT)
    };
    expect((await put(value.id, value.updatedAt, value)).statusCode).toBe(200);
    const response = await inject(app(), {
      url: `/me/creator-drafts/${value.id}`,
      headers
    });
    expect(response.json().value).toEqual(value);
  });

  it("keeps the newest version and rejects stale writes", async () => {
    await put("abcd1234", 200);

    const stale = await put("abcd1234", 100);
    expect(stale.statusCode).toBe(409);
    expect(stale.json()).toEqual({
      error: "DRAFT_CONFLICT",
      updatedAt: 200
    });
    expect((await put("abcd1234", 300)).statusCode).toBe(200);
  });

  it("rejects malformed drafts", async () => {
    expect((await put("short", 100)).statusCode).toBe(400);
    expect((await put("abcd1234", 100, draft("zzzzzzzz", 100))).statusCode).toBe(422);
    expect((await put("abcd1234", 100, { id: "abcd1234" })).statusCode).toBe(400);
    expect(
      (
        await put("abcd1234", 100, {
          ...draft("abcd1234", 100),
          blob: "x".repeat(3 * 1024 * 1024)
        })
      ).statusCode
    ).toBe(413);
  });

  it("limits the number of live drafts", async () => {
    for (let n = 0; n < 20; n++) expect((await put(`draft${String(n).padStart(3, "0")}`, 100)).statusCode).toBe(200);

    expect((await put("draftover", 100)).statusCode).toBe(400);
    expect((await put("overflow", 100)).statusCode).toBe(409);
  });

  it("deletes with a tombstone that older edits cannot revive", async () => {
    await put("abcd1234", 100);

    const deleted = await inject(app(), {
      method: "DELETE",
      url: "/me/creator-drafts/abcd1234",
      headers
    });
    expect(deleted.statusCode).toBe(200);

    const [entry] = await index();
    expect(entry).toMatchObject({
      id: "abcd1234",
      deleted: true
    });
    expect(
      (
        await inject(app(), {
          url: "/me/creator-drafts/abcd1234",
          headers
        })
      ).statusCode
    ).toBe(404);
    expect((await put("abcd1234", 100)).statusCode).toBe(409);
    expect((await put("abcd1234", entry?.updatedAt ? entry.updatedAt + 1 : 0)).statusCode).toBe(200);
  });
});