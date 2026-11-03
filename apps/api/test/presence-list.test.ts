import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { getPresenceListData } from "@/features/presence/presence.repository";
import { device, devicePresence, presenceActiveDevice } from "@nowly/database/schema/device";
import { presence, presenceLike } from "@nowly/database/schema/presence";
import { createTestDatabase, type TestDatabase } from "./database";

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
      version: "1.0.0"
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

  const list = await getPresenceListData();

  expect(list).toHaveLength(1);
  expect(list[0]).toMatchObject({
    slug: "youtube",
    name: "YouTube",
    version: "1.0.0",
    totalInstalls: 1,
    activeUsers: 1,
    likes: 1
  });
  expect(await db.select().from(presenceActiveDevice)).toHaveLength(2);
});