import { publicProfile } from "@nowly/database/schema/account";
import { presence, presenceLike } from "@nowly/database/schema/presence";
import { user } from "@nowly/database/schema/auth";
import { creatorPresence, presenceSubmission } from "@nowly/database/schema/creator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDatabase, seedUser, type TestDatabase } from "./database";
import { inject, mount } from "./http";

const mockSession = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock("@/features/auth/better-auth", () => ({
  getAuth: () => ({
    api: { getSession: vi.fn(async () => (mockSession.userId ? { user: { id: mockSession.userId } } : null)) }
  })
}));

const OWNER = "owner-1";
const OTHER = "owner-2";

let database: TestDatabase;

const app = async () => {
  const { publicProfileRoutes } = await import("@/features/public-profile/public-profile.routes");
  return mount("/", publicProfileRoutes);
};

const save = async (userId: string, payload: Record<string, unknown>) => {
  mockSession.userId = userId;
  const response = await inject(await app(), {
    method: "PUT",
    url: "/me/public-profile",
    payload
  });
  mockSession.userId = null;
  return response;
};

const BODY = {
  enabled: true,
  handle: "nolo",
  bio: "I make presences.",
  showCreated: true,
  showLiked: true
};

beforeAll(async () => {
  database = await createTestDatabase();
});
afterAll(() => database.close());
beforeEach(async () => {
  await database.reset();
  await seedUser(database.db, OWNER);
  await seedUser(database.db, OTHER);
  mockSession.userId = null;
});

describe("public profile settings", () => {
  it("is off by default and needs a session", async () => {
    expect((await inject(await app(), { url: "/me/public-profile" })).statusCode).toBe(401);

    mockSession.userId = OWNER;
    expect((await inject(await app(), { url: "/me/public-profile" })).json()).toEqual({
      enabled: false,
      handle: null,
      bio: null,
      showCreated: true,
      showLiked: true
    });
  });

  it("saves and normalises the handle", async () => {
    const res = await save(OWNER, {
      ...BODY,
      handle: "  Nolo "
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      handle: "nolo",
      enabled: true,
      bio: "I make presences."
    });
  });

  it("rejects bad or reserved handles and long bios", async () => {
    for (const handle of [
      "ab",
      "has space",
      "-start",
      "admin",
      "x".repeat(31)
    ])
      expect((await save(OWNER, { ...BODY, handle })).statusCode).toBe(400);

    expect(
      (
        await save(OWNER, {
          ...BODY,
          bio: "x".repeat(281)
        })
      ).statusCode
    ).toBe(400);
    expect(
      (
        await save(OWNER, {
          ...BODY,
          extra: true
        })
      ).statusCode
    ).toBe(400);
  });

  it("refuses a handle that is already taken", async () => {
    await save(OWNER, BODY);
    expect((await save(OTHER, BODY)).statusCode).toBe(409);
    expect(
      (
        await save(OWNER, {
          ...BODY,
          bio: "Updated"
        })
      ).statusCode
    ).toBe(200);
  });
});

describe("public profile page data", () => {
  it("answers 404 until the owner enables it", async () => {
    await save(OWNER, {
      ...BODY,
      enabled: false
    });
    expect((await inject(await app(), { url: "/users/nolo" })).statusCode).toBe(404);
    expect((await inject(await app(), { url: "/users/unknown" })).statusCode).toBe(404);

    await save(OWNER, BODY);
    expect((await inject(await app(), { url: "/users/Nolo" })).statusCode).toBe(200);
  });

  it("shows only what the owner chose and never private fields", async () => {
    await database.db.insert(presence).values({
      slug: "youtube",
      metadata: { name: "YouTube" }
    });
    await database.db.insert(presenceLike).values({
      slug: "youtube",
      deviceId: "device-1",
      userId: OWNER
    });
    await database.db.insert(creatorPresence).values({
      slug: "example-tube",
      definition: { name: "Example Tube" }
    });
    await database.db.insert(presenceSubmission).values({
      id: "a".repeat(24),
      draftId: "abcd1234",
      authorId: OWNER,
      kind: "create",
      slug: "example-tube",
      status: "published",
      revision: 1,
      publishedAt: new Date("2026-11-01T00:00:00Z")
    });
    await save(OWNER, BODY);

    const full = (await inject(await app(), { url: "/users/nolo" })).json();
    expect(full).toMatchObject({
      handle: "nolo",
      bio: "I make presences.",
      created: [
        {
          slug: "example-tube",
          name: "Example Tube"
        }
      ],
      liked: [
        {
          slug: "youtube",
          name: "YouTube"
        }
      ]
    });
    expect(Object.keys(full).sort()).toEqual(["bio", "created", "handle", "image", "liked", "name"]);

    await save(OWNER, {
      ...BODY,
      showCreated: false,
      showLiked: false
    });
    expect((await inject(await app(), { url: "/users/nolo" })).json()).toMatchObject({
      created: null,
      liked: null
    });
  });

  it("is erased with the account", async () => {
    await save(OWNER, BODY);
    await database.db.delete(user).where(eq(user.id, OWNER));
    expect(await database.db.select().from(publicProfile)).toEqual([]);
  });
});