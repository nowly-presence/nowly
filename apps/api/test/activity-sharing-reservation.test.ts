import { beforeEach, describe, expect, it } from "vitest";
import { LOCAL_KEY, PORTABLE_ACTIVITY, PUBLIC_ID, PUBLISHER_AUTH, publicationDb, publicationTestApp, publisherToken, resetPublicationDb } from "./activity-sharing.fixture";

describe("server-generated publication reservations", () => {
  beforeEach(resetPublicationDb);
  it("reserves privately and idempotently without overwriting content or revision", async () => {
    const app = await publicationTestApp();

    const reserve = (extra = {}) =>
      app.inject({
        method: "POST",
        url: `/me/activity-publications/${LOCAL_KEY}`,
        headers: PUBLISHER_AUTH,
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
    expect(publicationDb.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "verified-owner" }
      })
    );
    expect(publicationDb.activityPublication.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "verified-owner",
        localKey: LOCAL_KEY,
        revision: 0,
        published: false,
        activity: PORTABLE_ACTIVITY
      })
    });
    publicationDb.activityPublication.findUnique.mockResolvedValue({
      id: PUBLIC_ID,
      revision: 4,
      published: true
    });
    expect((await reserve()).json()).toEqual({
      id: PUBLIC_ID,
      revision: 4,
      published: true
    });
    expect(publicationDb.activityPublication.create).toHaveBeenCalledTimes(1);
    expect(publicationDb.activityPublication.updateMany).not.toHaveBeenCalled();
    expect((await reserve({ id: PUBLIC_ID })).statusCode).toBe(400);
    expect(
      (
        await reserve({
          author: { name: "forged" }
        })
      ).statusCode
    ).toBe(400);
    await app.close();
  });
  it("never creates on PUT, including stale publication after account erasure", async () => {
    const app = await publicationTestApp();
    publicationDb.activityPublication.updateMany.mockResolvedValue({ count: 0 });
    const write = () =>
      app.inject({
        method: "PUT",
        url: `/me/activity-publications/${LOCAL_KEY}`,
        headers: PUBLISHER_AUTH,
        payload: {
          id: PUBLIC_ID,
          activity: PORTABLE_ACTIVITY,
          baseRevision: 0
        }
      });
    expect((await write()).statusCode).toBe(409);
    expect(publicationDb.activityPublication.create).not.toHaveBeenCalled();
    expect(publicationDb.activityPublication.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: PUBLIC_ID,
          userId: "verified-owner",
          localKey: LOCAL_KEY,
          revision: 0
        }
      })
    );
    publicationDb.extensionToken.findUnique.mockResolvedValue(null);
    expect((await write()).statusCode).toBe(401);
    publicationDb.extensionToken.findUnique.mockResolvedValue({
      ...publisherToken(),
      userId: "recreated-owner"
    });
    expect((await write()).statusCode).toBe(409);
    expect(publicationDb.activityPublication.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          id: PUBLIC_ID,
          userId: "recreated-owner",
          localKey: LOCAL_KEY,
          revision: 0
        }
      })
    );
    expect(publicationDb.activityPublication.create).not.toHaveBeenCalled();
    publicationDb.activityPublication.findUnique.mockResolvedValue(null);
    expect((await app.inject(`/activity-publications/${PUBLIC_ID}`)).json()).toEqual({ error: "NOT_FOUND" });
    publicationDb.activityPublication.findUnique.mockResolvedValue({ published: false });
    expect((await app.inject(`/activity-publications/${PUBLIC_ID}`)).json()).toEqual({ error: "UNPUBLISHED" });
    await app.close();
  });
  it("explicitly withdraws a revision-zero reservation and invalidates a delayed PUT", async () => {
    const app = await publicationTestApp();
    publicationDb.activityPublication.findFirst.mockResolvedValue({ id: PUBLIC_ID });
    const withdrawn = await app.inject({
      method: "DELETE",
      url: `/me/activity-publications/${PUBLIC_ID}`,
      headers: PUBLISHER_AUTH,
      payload: { baseRevision: 0 }
    });
    expect(withdrawn.json()).toEqual({
      id: PUBLIC_ID,
      revision: 1
    });
    expect(publicationDb.activityPublication.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: PUBLIC_ID,
          userId: "verified-owner",
          revision: 0
        },
        data: expect.objectContaining({
          published: false,
          revision: { increment: 1 }
        })
      })
    );
    publicationDb.activityPublication.updateMany.mockResolvedValue({ count: 0 });
    const late = await app.inject({
      method: "PUT",
      url: `/me/activity-publications/${LOCAL_KEY}`,
      headers: PUBLISHER_AUTH,
      payload: {
        id: PUBLIC_ID,
        activity: PORTABLE_ACTIVITY,
        baseRevision: 0
      }
    });
    expect(late.statusCode).toBe(409);
    await app.close();
  });
});