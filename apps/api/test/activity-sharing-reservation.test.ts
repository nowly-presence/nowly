import { activityPublication } from "@nowly/database/schema/activity";
import { extensionToken } from "@nowly/database/schema/account";
import { account, user } from "@nowly/database/schema/auth";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPublicationFixture, LOCAL_KEY, OWNER_ID, PORTABLE_ACTIVITY, PUBLIC_ID, resetPublicationFixture, type PublicationFixture } from "./activity-sharing.fixture";

let fixture: PublicationFixture;

const write = (headers = fixture.auth) =>
  fixture.request({
    method: "PUT",
    url: `/me/activity-publications/${LOCAL_KEY}`,
    headers,
    payload: {
      id: PUBLIC_ID,
      activity: PORTABLE_ACTIVITY,
      baseRevision: 0
    }
  });

beforeAll(async () => {
  fixture = await createPublicationFixture();
});
beforeEach(() => resetPublicationFixture(fixture));
afterAll(() => fixture.database.close());

describe("server-generated publication reservations", () => {
  it("reserves privately and idempotently without overwriting content or revision", async () => {
    const reserve = (extra = {}) =>
      fixture.request({
        method: "POST",
        url: `/me/activity-publications/${LOCAL_KEY}`,
        headers: fixture.auth,
        payload: {
          activity: PORTABLE_ACTIVITY,
          ...extra
        }
      });

    const first = await reserve();
    expect(first.statusCode).toBe(200);
    expect(first.json()).toEqual({
      id: expect.stringMatching(/^[a-f0-9]{32}$/),
      revision: 0,
      published: false
    });
    const [stored] = await fixture.database.db.select().from(activityPublication);
    expect(stored).toMatchObject({
      userId: OWNER_ID,
      localKey: LOCAL_KEY,
      revision: 0,
      published: false,
      activity: PORTABLE_ACTIVITY
    });

    await fixture.database.db.update(activityPublication).set({
      revision: 4,
      published: true
    });
    expect((await reserve()).json()).toEqual({
      id: stored.id,
      revision: 4,
      published: true
    });
    expect(await fixture.database.db.select().from(activityPublication)).toHaveLength(1);
    expect((await reserve({ id: PUBLIC_ID })).statusCode).toBe(400);
    expect(
      (
        await reserve({
          author: { name: "forged" }
        })
      ).statusCode
    ).toBe(400);
  });

  it("never creates on PUT, including stale publication after account erasure", async () => {
    expect((await write()).statusCode).toBe(409);
    expect(await fixture.database.db.select().from(activityPublication)).toEqual([]);

    await fixture.database.db.update(extensionToken).set({ revokedAt: new Date() });
    expect((await write()).statusCode).toBe(401);

    await fixture.seedPublication();
    await fixture.database.db.insert(user).values({
      id: "recreated-owner",
      name: "Recreated",
      email: "recreated@example.com"
    });
    await fixture.database.db.insert(account).values({
      id: "recreated-discord",
      userId: "recreated-owner",
      accountId: "5678",
      providerId: "discord"
    });
    expect((await write(await fixture.tokenFor("recreated-owner"))).statusCode).toBe(409);
    expect((await fixture.storedPublication())?.userId).toBe(OWNER_ID);

    expect((await fixture.request(`/activity-publications/${"c".repeat(32)}`)).json()).toEqual({ error: "NOT_FOUND" });
    await fixture.database.db.update(activityPublication).set({ published: false }).where(eq(activityPublication.id, PUBLIC_ID));
    expect((await fixture.request(`/activity-publications/${PUBLIC_ID}`)).json()).toEqual({ error: "UNPUBLISHED" });
  });

  it("explicitly withdraws a revision-zero reservation and invalidates a delayed PUT", async () => {
    await fixture.seedPublication({
      revision: 0,
      published: false
    });

    const withdrawn = await fixture.request({
      method: "DELETE",
      url: `/me/activity-publications/${PUBLIC_ID}`,
      headers: fixture.auth,
      payload: { baseRevision: 0 }
    });
    expect(withdrawn.json()).toEqual({
      id: PUBLIC_ID,
      revision: 1
    });
    expect(await fixture.storedPublication()).toMatchObject({
      published: false,
      revision: 1
    });

    expect((await write()).statusCode).toBe(409);
  });
});