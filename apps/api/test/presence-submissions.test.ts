import { adminAuditEvent } from "@nowly/database/schema/admin";
import { user } from "@nowly/database/schema/auth";
import { creatorPresence, presenceSubmissionRevision } from "@nowly/database/schema/creator";
import { presence } from "@nowly/database/schema/presence";
import { creatorDefinition, presenceSlug } from "@nowly/presence-creator";
import { sampleCreatorDraft } from "@nowly/presence-creator/creator-fixtures";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDatabase, seedExtensionToken, seedUser, type TestDatabase } from "./database";
import { inject, mount } from "./http";

const mockSession = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock("@/features/auth/better-auth", () => ({
  getAuth: () => ({
    api: { getSession: vi.fn(async () => (mockSession.userId ? { user: { id: mockSession.userId } } : null)) }
  })
}));

const AUTHOR = "author-1";
const OTHER = "author-2";
const MODERATOR = "moderator-1";
const ADMIN = "admin-1";
const WEBHOOK_SECRET = "creator-webhook-test";

let database: TestDatabase;
let creator: Record<string, string>;

const SAMPLE = {
  ...creatorDefinition(sampleCreatorDraft()),
  id: "abcd1234"
};

const definition = (overrides: Record<string, unknown> = {}) => ({ ...structuredClone(SAMPLE), ...overrides });

const slug = presenceSlug(SAMPLE.name);

const app = async () => {
  const [{ presenceSubmissionRoutes }, { accountRoutes }] = await Promise.all([
    import("@/features/presence-submissions/presence-submissions.routes"),
    import("@/features/account/account.routes")
  ]);
  return mount("/", presenceSubmissionRoutes).route("/", accountRoutes);
};

const submit = async (
  headers = creator,
  body: Record<string, unknown> = {
    definition: definition(),
    translate: true
  }
) =>
  inject(await app(), {
    method: "POST",
    url: "/me/presence-submissions",
    headers,
    payload: body
  });

const asSession = async (userId: string, request: Parameters<typeof inject>[1]) => {
  mockSession.userId = userId;
  const response = await inject(await app(), request);
  mockSession.userId = null;
  return response;
};

const review = (userId: string, id: string, payload: Record<string, unknown>) =>
  asSession(userId, {
    method: "POST",
    url: `/presence-submissions/${id}/reviews`,
    payload
  });

const publish = (userId: string, id: string, revision: number) =>
  asSession(userId, {
    method: "POST",
    url: `/presence-submissions/${id}/publish`,
    payload: { revision }
  });

const detail = (userId: string, id: string) => asSession(userId, { url: `/presence-submissions/${id}` });

beforeAll(async () => {
  database = await createTestDatabase();
});
beforeEach(async () => {
  vi.stubEnv("CREATOR_WEBHOOK_SECRET", WEBHOOK_SECRET);
  await database.reset();

  for (const id of [AUTHOR, OTHER, MODERATOR, ADMIN]) await seedUser(database.db, id);

  await database.db.update(user).set({ discordId: "1234" }).where(eq(user.id, AUTHOR));
  await database.db.update(user).set({ discordId: "5678" }).where(eq(user.id, OTHER));
  await database.db.update(user).set({ role: "moderator" }).where(eq(user.id, MODERATOR));
  await database.db.update(user).set({ role: "admin" }).where(eq(user.id, ADMIN));
  creator = {
    authorization: `Bearer ${await seedExtensionToken({
      userId: AUTHOR,
      scopes: ["creator"]
    })}`
  };
});
afterEach(() => vi.unstubAllEnvs());
afterAll(() => database.close());

describe("submitting a presence", () => {
  it("needs a creator token and a linked Discord account", async () => {
    expect((await submit({})).statusCode).toBe(401);
    expect(
      (
        await submit({
          authorization: `Bearer ${await seedExtensionToken({
            userId: AUTHOR,
            scopes: ["sync"]
          })}`
        })
      ).statusCode
    ).toBe(401);

    const noDiscord = await submit({
      authorization: `Bearer ${await seedExtensionToken({
        userId: ADMIN,
        scopes: ["creator"]
      })}`
    });
    expect(noDiscord.statusCode).toBe(403);
    expect(noDiscord.json().error).toBe("CREATOR_REQUIRED");
  });

  it("stores revision 1 with the account as author and server-generated files", async () => {
    const res = await submit(creator, {
      definition: definition({
        author: { name: "Forged" },
        script: "fetch('x')"
      }),
      translate: true,
      files: [
        {
          path: "x.ts",
          content: "evil"
        }
      ]
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      status: "submitted",
      revision: 1
    });

    const [revision] = await database.db.select().from(presenceSubmissionRevision);
    expect(revision.definition).toMatchObject({
      author: {
        name: AUTHOR,
        discord: "1234"
      }
    });
    expect(revision.definition).not.toHaveProperty("script");
    expect(JSON.stringify(revision.files)).not.toContain("evil");
    expect(revision.changes).toEqual([
      {
        field: "definition",
        kind: "added"
      }
    ]);
  });

  it("answers 422 with a readable message for an invalid definition", async () => {
    const res = await submit(creator, {
      definition: definition({
        pages: []
      })
    });
    expect(res.statusCode).toBe(422);
    expect(typeof res.json().message).toBe("string");
  });

  it("refuses a second submission for the same presence and edits of a catalog presence", async () => {
    await submit();
    const other = await submit(
      {
        authorization: `Bearer ${await seedExtensionToken({
          userId: OTHER,
          scopes: ["creator"]
        })}`
      },
      { definition: definition({ id: "zz99yy88" }) }
    );
    expect(other.statusCode).toBe(409);
    expect(other.json().error).toBe("SUBMISSION_PENDING");

    await database.reset();
    await seedUser(database.db, AUTHOR);
    await database.db.update(user).set({ discordId: "1234" }).where(eq(user.id, AUTHOR));
    await database.db.insert(presence).values({ slug });
    const legacy = await submit({
      authorization: `Bearer ${await seedExtensionToken({
        userId: AUTHOR,
        scopes: ["creator"]
      })}`
    });
    expect(legacy.json().error).toBe("NOT_CREATOR_PRESENCE");
  });

  it("locks a submission under review and accepts a new revision after changes are requested", async () => {
    const { id } = (await submit()).json();
    expect((await submit()).json().error).toBe("SUBMISSION_LOCKED");

    await review(MODERATOR, id, {
      revision: 1,
      verdict: "request_changes",
      message: "Fix the video page",
      comments: [
        {
          field: "page.details",
          page: "Video",
          message: "First line is empty"
        }
      ]
    });
    const statuses = (
      await inject(await app(), {
        url: `/me/presence-submissions?ids=${id}`,
        headers: creator
      })
    ).json();
    expect(statuses).toEqual([
      expect.objectContaining({
        id,
        status: "changes_requested",
        note: "Fix the video page"
      })
    ]);

    const base = definition();
    const resent = await submit(creator, {
      definition: {
        ...base,
        description: {
          ...base.description,
          "en-US": "A better description"
        }
      }
    });
    expect(resent.json()).toMatchObject({
      id,
      status: "submitted",
      revision: 2
    });
    const body = (await detail(AUTHOR, id)).json();
    expect(body.revisions.map((item: { number: number }) => item.number)).toEqual([1, 2]);
    expect(body.revisions[1].changes).toEqual([
      {
        field: "description",
        kind: "changed"
      }
    ]);
    expect(body.reviews[0]).toMatchObject({
      verdict: "request_changes",
      revision: 1,
      reviewer: { id: MODERATOR },
      comments: [
        {
          field: "page.details",
          page: "Video"
        }
      ]
    });
    expect(body.history.map((event: { type: string }) => event.type)).toEqual(["submitted", "review.request_changes", "resubmitted"]);
  });
});

describe("reviewing and publishing", () => {
  it("lets a moderator approve but only an admin publish", async () => {
    const { id } = (await submit()).json();

    expect((await asSession(MODERATOR, { url: "/presence-submissions/queue" })).json().items).toHaveLength(1);
    expect(
      (
        await review(MODERATOR, id, {
          revision: 1,
          verdict: "approve"
        })
      ).json()
    ).toMatchObject({ status: "approved" });
    expect((await publish(MODERATOR, id, 1)).statusCode).toBe(403);

    const published = await publish(ADMIN, id, 1);
    expect(published.json()).toMatchObject({
      status: "in_progress",
      withoutReview: false
    });
    expect((await database.db.select().from(adminAuditEvent)).map((event) => event.action)).toEqual(["submission.review", "submission.publish"]);
  });

  it("marks a direct admin publication as published without review", async () => {
    const { id } = (await submit()).json();
    expect((await publish(ADMIN, id, 1)).json().withoutReview).toBe(true);

    const history = (await detail(ADMIN, id)).json().history;
    expect(history.at(-1)).toMatchObject({
      type: "publish",
      actor: { id: ADMIN },
      details: { withoutReview: true }
    });
  });

  it("refuses stale revisions, own reviews, invalid transitions and empty change requests", async () => {
    const { id } = (await submit()).json();
    expect(
      (
        await review(MODERATOR, id, {
          revision: 2,
          verdict: "approve"
        })
      ).json().error
    ).toBe("STALE_REVISION");
    expect(
      (
        await review(MODERATOR, id, {
          revision: 1,
          verdict: "request_changes"
        })
      ).statusCode
    ).toBe(400);
    expect(
      (
        await review(AUTHOR, id, {
          revision: 1,
          verdict: "approve"
        })
      ).statusCode
    ).toBe(403);

    await review(MODERATOR, id, {
      revision: 1,
      verdict: "reject",
      message: "Duplicate of an existing presence"
    });
    expect(
      (
        await review(MODERATOR, id, {
          revision: 1,
          verdict: "approve"
        })
      ).json().error
    ).toBe("INVALID_TRANSITION");
    expect((await publish(ADMIN, id, 1)).json().error).toBe("INVALID_TRANSITION");
  });

  it("shows a submission only to its author and reviewers", async () => {
    const { id } = (await submit()).json();
    expect((await detail(AUTHOR, id)).statusCode).toBe(200);
    expect((await detail(MODERATOR, id)).statusCode).toBe(200);
    expect((await detail(OTHER, id)).statusCode).toBe(404);
    expect((await inject(await app(), { url: `/presence-submissions/${id}` })).statusCode).toBe(401);
  });
});

describe("publication webhook and creator presences", () => {
  const webhook = async (payload: Record<string, unknown>, secret = WEBHOOK_SECRET) =>
    inject(await app(), {
      method: "POST",
      url: "/presence-submissions/published",
      headers: { authorization: `Bearer ${secret}` },
      payload
    });

  it("publishes, stores the creator definition and turns the next submission into an update", async () => {
    const { id } = (await submit()).json();
    await review(MODERATOR, id, {
      revision: 1,
      verdict: "approve"
    });
    await publish(ADMIN, id, 1);

    expect(
      (
        await webhook(
          {
            slug,
            commit: "abc1234",
            pr: 42
          },
          "wrong"
        )
      ).statusCode
    ).toBe(401);
    expect(
      (
        await webhook({
          slug,
          commit: "abc1234",
          pr: 42
        })
      ).json()
    ).toMatchObject({
      id,
      status: "published"
    });
    const [stored] = await database.db.select().from(creatorPresence);
    expect(stored).toMatchObject({
      slug,
      revision: 1,
      submissionId: id,
      updatedById: AUTHOR
    });
    expect(
      (
        await webhook({
          slug,
          commit: "abc1234",
          pr: 42
        })
      ).json().error
    ).toBe("NOT_PUBLISHING");

    const base = definition({ id: "upd8te01" });
    const update = await submit(
      {
        authorization: `Bearer ${await seedExtensionToken({
          userId: OTHER,
          scopes: ["creator"]
        })}`
      },
      {
        definition: {
          ...base,
          color: "#112233"
        }
      }
    );
    expect(update.statusCode).toBe(201);
    const body = (await detail(MODERATOR, update.json().id)).json();
    expect(body).toMatchObject({
      kind: "update",
      baseRevision: 1
    });
    expect(body.revisions[0].changes).toEqual([
      {
        field: "color",
        kind: "changed"
      }
    ]);
  });

  it("exports the author's submissions and erases them with the account", async () => {
    await submit();
    mockSession.userId = AUTHOR;
    const server = await app();
    expect((await inject(server, { url: "/me/export" })).json().presenceSubmissions).toHaveLength(1);
    await inject(server, {
      method: "DELETE",
      url: "/me"
    });
    expect(await database.db.select().from(presenceSubmissionRevision)).toEqual([]);
  });
});