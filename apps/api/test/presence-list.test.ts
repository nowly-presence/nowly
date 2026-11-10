import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { presenceRoutes } from "@/features/presence/presence.routes";
import { device, devicePresence, presenceActiveDevice } from "@nowly/database/schema/device";
import { presence, presenceLike } from "@nowly/database/schema/presence";
import { user } from "@nowly/database/schema/auth";
import { eq } from "drizzle-orm";
import { createTestDatabase, seedUser, type TestDatabase } from "./database";
import { inject, mount } from "./http";

const getCatalog = () => inject(mount("/presences", presenceRoutes), { url: "/presences" });

const STALE_MS = 13 * 60_000;
let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase();
});
beforeEach(() => database.reset());
afterAll(() => database.close());

it("lists unarchived presences with installs, fresh activity and likes, without deleting stale activity", async () => {
  const { db } = database;
  await db.insert(presence).values([
    {
      slug: "youtube",
      metadata: {
        slug: "youtube",
        name: "YouTube"
      },
      version: "1.0.0",
      addedAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-06-01")
    },
    {
      slug: "old",
      metadata: {
        slug: "old",
        name: "Old"
      },
      archived: true
    }
  ]);
  await db.insert(device).values([
    { deviceId: "a" },
    { deviceId: "b" }
  ]);
  await db.insert(devicePresence).values([
    {
      deviceId: "a",
      slug: "youtube"
    },
    {
      deviceId: "b",
      slug: "youtube",
      installed: false
    }
  ]);
  await db.insert(presenceActiveDevice).values([
    {
      slug: "youtube",
      deviceId: "a"
    },
    {
      slug: "youtube",
      deviceId: "b",
      lastSeenAt: new Date(Date.now() - STALE_MS)
    }
  ]);
  await db.insert(presenceLike).values({
    slug: "youtube",
    deviceId: "a"
  });

  const response = await getCatalog();
  expect(response.statusCode).toBe(200);
  const list = response.json();

  expect(list).toHaveLength(1);
  expect(list[0]).toMatchObject({
    slug: "youtube",
    name: "YouTube",
    version: "1.0.0",
    addedAt: "2024-01-01T00:00:00.000Z",
    lastUpdated: "2024-06-01T00:00:00.000Z",
    totalInstalls: 1,
    activeUsers: 1,
    likes: 1
  });
  expect(await db.select().from(presenceActiveDevice)).toHaveLength(2);
});
it("adds the Discord avatar of a creator author to the listed presence", async () => {
  const { db } = database;
  await seedUser(db, "author-1");
  await db
    .update(user)
    .set({
      discordId: "1234",
      image: "https://cdn.discordapp.com/avatars/1234/abc.png"
    })
    .where(eq(user.id, "author-1"));
  await db.insert(presence).values([
    {
      slug: "made",
      metadata: {
        slug: "made",
        name: "Made",
        author: {
          name: "Gaëtan",
          discord: "1234"
        }
      }
    },
    {
      slug: "unknown",
      metadata: {
        slug: "unknown",
        name: "Unknown",
        author: {
          name: "Someone",
          discord: "9999"
        }
      }
    },
    {
      slug: "hand",
      metadata: {
        slug: "hand",
        name: "Hand",
        author: {
          name: "Dev",
          github: "dev"
        }
      }
    }
  ]);

  const response = await getCatalog();
  expect(response.statusCode).toBe(200);
  const list = response.json<
    {
      slug: string;
      author: unknown;
    }[]
  >();

  const author = (slug: string) => list.find((item) => item.slug === slug)?.author;

  expect(author("made")).toEqual({
    name: "Gaëtan",
    discord: "1234",
    avatar: "https://cdn.discordapp.com/avatars/1234/abc.png"
  });
  expect(author("unknown")).toEqual({
    name: "Someone",
    discord: "9999"
  });
  expect(author("hand")).toEqual({
    name: "Dev",
    github: "dev"
  });
});