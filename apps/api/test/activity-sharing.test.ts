import { overrideDatabase } from "@/db/client";
import { account, user } from "@nowly/database/schema/auth";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPublicationFixture, LOCAL_KEY, OWNER_ID, PORTABLE_ACTIVITY, PUBLIC_ID, resetPublicationFixture, type PublicationFixture } from "./activity-sharing.fixture";

let fixture: PublicationFixture;

const writeRequest = (extra: Record<string, unknown> = {}, headers = fixture.auth) => ({
  method: "PUT" as const,
  url: `/me/activity-publications/${LOCAL_KEY}`,
  headers,
  payload: {
    id: PUBLIC_ID,
    activity: PORTABLE_ACTIVITY,
    baseRevision: 0,
    ...extra
  }
});

beforeAll(async () => {
  fixture = await createPublicationFixture();
});
afterAll(() => fixture.database.close());

describe("activity publication authentication and public projection", () => {
  beforeEach(async () => {
    overrideDatabase(fixture.database.db);
    await resetPublicationFixture(fixture);
  });

  it("fails closed without database, authentication or creator scope", async () => {
    expect((await fixture.request(writeRequest({}, {}))).statusCode).toBe(401);
    expect((await fixture.request(writeRequest({}, await fixture.tokenFor(OWNER_ID, ["sync"])))).statusCode).toBe(401);
    overrideDatabase(null);
    expect((await fixture.request(`/activity-publications/${PUBLIC_ID}`)).statusCode).toBe(503);
    expect((await fixture.request(writeRequest())).statusCode).toBe(503);
    overrideDatabase(fixture.database.db);
    expect(await fixture.storedPublication()).toBeUndefined();
  });

  it("derives ownership from the account and refuses forged authors", async () => {
    await fixture.seedPublication({
      revision: 0,
      published: false
    });
    expect(
      (
        await fixture.request(
          writeRequest({
            author: { name: "forged" }
          })
        )
      ).statusCode
    ).toBe(400);

    const result = await fixture.request(writeRequest());
    expect(result.statusCode).toBe(200);
    expect(result.json().id).toMatch(/^[a-f0-9]{32}$/);
    expect(await fixture.storedPublication()).toMatchObject({
      userId: OWNER_ID,
      activity: PORTABLE_ACTIVITY,
      published: true,
      revision: 1
    });

    await fixture.database.db.delete(account).where(eq(account.userId, OWNER_ID));
    expect((await fixture.request(writeRequest({ baseRevision: 1 }))).statusCode).toBe(403);
  });

  it("returns only portable content and public author name and avatar", async () => {
    const author = {
      name: "Verified",
      image: "https://cdn.discordapp.com/avatar.png"
    };
    await fixture.database.db.update(user).set(author).where(eq(user.id, OWNER_ID));
    await fixture.seedPublication({
      revision: 2,
      published: true
    });

    const result = await fixture.request(`/activity-publications/${PUBLIC_ID}`);
    expect(result.json()).toEqual({
      id: PUBLIC_ID,
      revision: 2,
      activity: PORTABLE_ACTIVITY,
      author
    });
    expect(result.headers["cache-control"]).toBe("no-store");
  });
});