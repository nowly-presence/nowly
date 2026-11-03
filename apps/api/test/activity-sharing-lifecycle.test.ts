import { activityPublication } from "@nowly/database/schema/activity";
import { user } from "@nowly/database/schema/auth";
import { PUBLICATION_QUOTA } from "@nowly/shared/activity-publication";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPublicationFixture, LOCAL_KEY, OWNER_ID, PORTABLE_ACTIVITY, PUBLIC_ID, resetPublicationFixture, type PublicationFixture } from "./activity-sharing.fixture";

let fixture: PublicationFixture;

beforeAll(async () => {
  fixture = await createPublicationFixture();
});
beforeEach(() => resetPublicationFixture(fixture));
afterAll(() => fixture.database.close());

describe("activity publication lifecycle", () => {
  it("keeps the link stable, increments revisions and rejects stale writes", async () => {
    await fixture.seedPublication({ revision: 2 });
    const write = (baseRevision: number) =>
      fixture.request({
        method: "PUT",
        url: `/me/activity-publications/${LOCAL_KEY}`,
        headers: fixture.auth,
        payload: {
          id: PUBLIC_ID,
          activity: PORTABLE_ACTIVITY,
          baseRevision
        }
      });

    expect((await write(1)).statusCode).toBe(409);
    expect((await write(2)).json()).toEqual({
      id: PUBLIC_ID,
      revision: 3
    });
    expect((await fixture.storedPublication())?.revision).toBe(3);
  });

  it("enforces quota, owner-only unpublish and tombstone revisions", async () => {
    await fixture.database.db.insert(activityPublication).values(
      Array.from({ length: PUBLICATION_QUOTA }, (_, index) => ({
        id: `${index}`.padStart(32, "b"),
        userId: OWNER_ID,
        localKey: `key-${index}`,
        activity: PORTABLE_ACTIVITY
      }))
    );
    const full = await fixture.request({
      method: "POST",
      url: `/me/activity-publications/${LOCAL_KEY}`,
      headers: fixture.auth,
      payload: { activity: PORTABLE_ACTIVITY }
    });
    expect(full.statusCode).toBe(429);
    await resetPublicationFixture(fixture);

    const remove = (headers = fixture.auth) =>
      fixture.request({
        method: "DELETE",
        url: `/me/activity-publications/${PUBLIC_ID}`,
        headers,
        payload: { baseRevision: 2 }
      });
    expect((await remove()).statusCode).toBe(404);

    await fixture.seedPublication({ revision: 2 });
    await fixture.database.db.insert(user).values({
      id: "stranger",
      name: "Stranger",
      email: "stranger@example.com"
    });
    expect((await remove(await fixture.tokenFor("stranger"))).statusCode).toBe(404);

    await fixture.database.db.update(activityPublication).set({ revision: 5 });
    expect((await remove()).statusCode).toBe(409);
    await fixture.database.db.update(activityPublication).set({ revision: 2 });
    expect((await remove()).json()).toEqual({
      id: PUBLIC_ID,
      revision: 3
    });
    expect(await fixture.storedPublication()).toMatchObject({
      published: false,
      revision: 3
    });
    expect((await fixture.request(`/activity-publications/${PUBLIC_ID}`)).statusCode).toBe(404);
  });
});