import { beforeEach, describe, expect, it } from "vitest";
import { LOCAL_KEY, PORTABLE_ACTIVITY, PUBLIC_ID, PUBLISHER_AUTH, publicationDb, publicationTestApp, resetPublicationDb } from "./activity-sharing.fixture";

describe("activity publication lifecycle", () => {
  beforeEach(resetPublicationDb);
  it("keeps the link stable, increments revisions and rejects stale writes", async () => {
    publicationDb.activityPublication.findUnique.mockResolvedValue({
      id: PUBLIC_ID,
      revision: 2
    });
    const app = await publicationTestApp();

    const write = (baseRevision: number) =>
      app.inject({
        method: "PUT",
        url: `/me/activity-publications/${LOCAL_KEY}`,
        headers: PUBLISHER_AUTH,
        payload: {
          id: PUBLIC_ID,
          activity: PORTABLE_ACTIVITY,
          baseRevision
        }
      });
    publicationDb.activityPublication.updateMany.mockResolvedValueOnce({ count: 0 });
    expect((await write(1)).statusCode).toBe(409);
    expect((await write(2)).json()).toEqual({
      id: PUBLIC_ID,
      revision: 3
    });
    expect(publicationDb.activityPublication.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: PUBLIC_ID,
          userId: "verified-owner",
          localKey: LOCAL_KEY,
          revision: 2
        }
      })
    );
    await app.close();
  });
  it("enforces quota, owner-only unpublish and tombstone revisions", async () => {
    const app = await publicationTestApp();
    publicationDb.activityPublication.count.mockResolvedValue(20);
    const full = await app.inject({
      method: "POST",
      url: `/me/activity-publications/${LOCAL_KEY}`,
      headers: PUBLISHER_AUTH,
      payload: { activity: PORTABLE_ACTIVITY }
    });
    expect(full.statusCode).toBe(429);
    publicationDb.activityPublication.findFirst.mockResolvedValue(null);
    const remove = () =>
      app.inject({
        method: "DELETE",
        url: `/me/activity-publications/${PUBLIC_ID}`,
        headers: PUBLISHER_AUTH,
        payload: { baseRevision: 2 }
      });
    expect((await remove()).statusCode).toBe(404);
    expect(publicationDb.activityPublication.findFirst).toHaveBeenCalledWith({
      where: {
        id: PUBLIC_ID,
        userId: "verified-owner"
      }
    });
    publicationDb.activityPublication.findFirst.mockResolvedValue({ id: PUBLIC_ID });
    publicationDb.activityPublication.updateMany.mockResolvedValue({ count: 0 });
    expect((await remove()).statusCode).toBe(409);
    publicationDb.activityPublication.updateMany.mockResolvedValue({ count: 1 });
    expect((await remove()).json()).toEqual({
      id: PUBLIC_ID,
      revision: 3
    });
    publicationDb.activityPublication.findUnique.mockResolvedValue({ published: false });
    expect((await app.inject(`/activity-publications/${PUBLIC_ID}`)).statusCode).toBe(404);
    await app.close();
  });
});