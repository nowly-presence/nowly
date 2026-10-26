import { beforeEach, describe, expect, it } from "vitest";
import { LOCAL_KEY, PORTABLE_ACTIVITY, PUBLIC_ID, PUBLISHER_AUTH, publicationDb, publicationTestApp, publisherToken, resetPublicationDb } from "./activity-sharing.fixture";

const writeRequest = (extra: Record<string, unknown> = {}) => ({
  method: "PUT" as const,
  url: `/me/activity-publications/${LOCAL_KEY}`,
  headers: PUBLISHER_AUTH,
  payload: {
    id: PUBLIC_ID,
    activity: PORTABLE_ACTIVITY,
    baseRevision: 0,
    ...extra
  }
});

describe("activity publication authentication and public projection", () => {
  beforeEach(resetPublicationDb);
  it("fails closed without database, authentication or creator scope", async () => {
    const app = await publicationTestApp();
    expect(
      (
        await app.inject({
          ...writeRequest(),
          headers: {}
        })
      ).statusCode
    ).toBe(401);
    publicationDb.extensionToken.findUnique.mockResolvedValue(publisherToken(["sync"]));
    expect((await app.inject(writeRequest())).statusCode).toBe(401);
    publicationDb.available = false;
    expect((await app.inject(`/activity-publications/${PUBLIC_ID}`)).statusCode).toBe(503);
    expect((await app.inject(writeRequest())).statusCode).toBe(503);
    expect(publicationDb.activityPublication.create).not.toHaveBeenCalled();
    await app.close();
  });
  it("derives ownership from the account and refuses forged authors", async () => {
    const app = await publicationTestApp();
    expect(
      (
        await app.inject(
          writeRequest({
            author: { name: "forged" }
          })
        )
      ).statusCode
    ).toBe(400);
    const result = await app.inject(writeRequest());
    expect(result.statusCode).toBe(200);
    expect(result.json().id).toMatch(/^[a-f0-9]{32}$/);
    expect(publicationDb.activityPublication.updateMany).toHaveBeenCalledWith({
      where: {
        id: PUBLIC_ID,
        userId: "verified-owner",
        localKey: LOCAL_KEY,
        revision: 0
      },
      data: expect.objectContaining({
        activity: PORTABLE_ACTIVITY,
        published: true
      })
    });
    publicationDb.account.findFirst.mockResolvedValue(null);
    expect((await app.inject(writeRequest())).statusCode).toBe(403);
    await app.close();
  });
  it("returns only portable content and public author name and avatar", async () => {
    const author = {
      name: "Verified",
      image: "https://cdn.discordapp.com/avatar.png"
    };
    publicationDb.activityPublication.findUnique.mockResolvedValue({
      id: PUBLIC_ID,
      revision: 2,
      published: true,
      activity: PORTABLE_ACTIVITY,
      userId: "private",
      localKey: LOCAL_KEY,
      user: {
        ...author,
        email: "private@example.com",
        discordId: "private"
      }
    });
    const app = await publicationTestApp();

    const result = await app.inject(`/activity-publications/${PUBLIC_ID}`);
    expect(result.json()).toEqual({
      id: PUBLIC_ID,
      revision: 2,
      activity: PORTABLE_ACTIVITY,
      author
    });
    expect(result.headers["cache-control"]).toBe("no-store");
    await app.close();
  });
});