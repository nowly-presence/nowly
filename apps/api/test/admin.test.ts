import { adminAuditEvent } from "@nowly/database/schema/admin";
import { extensionToken } from "@nowly/database/schema/account";
import { announcement } from "@nowly/database/schema/announcement";
import { user } from "@nowly/database/schema/auth";
import { eq, isNull } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDatabase, seedExtensionToken, seedUser, type TestDatabase } from "./database";
import { inject, mount } from "./http";
import type { AppEnv } from "@/context";
import { Hono } from "hono";

const mockSession = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock("@/features/auth/better-auth", () => ({
  getAuth: () => ({
    api: { getSession: vi.fn(async () => (mockSession.userId ? { user: { id: mockSession.userId } } : null)) }
  })
}));
vi.mock("@/features/announcements/announcements.changelog", () => ({
  readReleaseAnnouncements: async () => []
}));

const ADMIN = "admin-1";
const MEMBER = "member-1";
const DEVICE_ID = "8b3f2e7c-5a0d-4c1e-9f6b-2d7a1c3e4f50";
const ANNOUNCEMENT = {
  translations: {
    en: {
      title: "Maintenance",
      description: "Library update"
    }
  },
  kind: "maintenance",
  pinned: false
};

let database: TestDatabase;

const app = async () => {
  const [{ accountRoutes }, { adminRoutes }, { createAnnouncementsRoutes }] = await Promise.all([
    import("@/features/account/account.routes"),
    import("@/features/admin/admin.routes"),
    import("@/features/announcements/announcements.routes")
  ]);
  return mount("/", accountRoutes).route("/admin", adminRoutes).route("/announcements", createAnnouncementsRoutes());
};

const bearer = async (userId: string, scopes: Array<"sync" | "creator" | "admin">) => ({
  authorization: `Bearer ${await seedExtensionToken({
    userId,
    deviceId: DEVICE_ID,
    scopes
  })}`
});

const setRole = (id: string, role: string) => database.db.update(user).set({ role }).where(eq(user.id, id));

beforeAll(async () => {
  database = await createTestDatabase();
});
beforeEach(async () => {
  await database.reset();
  await seedUser(database.db, ADMIN);
  await seedUser(database.db, MEMBER);
  await setRole(ADMIN, "admin");
  mockSession.userId = null;
});
afterEach(() => vi.unstubAllEnvs());
afterAll(() => database.close());

describe("roles and capabilities", () => {
  it("returns the role and capabilities from the database on /me", async () => {
    const server = await app();
    mockSession.userId = ADMIN;
    expect((await inject(server, { url: "/me" })).json()).toMatchObject({
      role: "admin",
      capabilities: ["review", "publish", "announce", "manage"]
    });

    mockSession.userId = MEMBER;
    expect((await inject(server, { url: "/me" })).json()).toMatchObject({
      role: "user",
      capabilities: []
    });
  });

  it("grants nothing to an unknown role", async () => {
    await setRole(MEMBER, "superadmin");
    mockSession.userId = MEMBER;
    const server = await app();

    expect((await inject(server, { url: "/me" })).json().capabilities).toEqual([]);
    expect((await inject(server, { url: "/admin/audit" })).statusCode).toBe(403);
  });

  it("only mints the admin scope for staff accounts", async () => {
    const server = await app();
    mockSession.userId = MEMBER;
    const refused = await inject(server, {
      method: "POST",
      url: "/extension/tokens",
      payload: {
        scopes: ["sync", "admin"]
      }
    });
    expect(refused.statusCode).toBe(403);
    expect(refused.json()).toEqual({ error: "ADMIN_REQUIRED" });

    mockSession.userId = ADMIN;
    const granted = await inject(server, {
      method: "POST",
      url: "/extension/tokens",
      payload: {
        scopes: ["sync", "admin"]
      }
    });
    expect(granted.statusCode).toBe(200);
    expect(granted.json().scopes).toEqual(["sync", "admin"]);
  });

  it("re-reads the role on every admin request, whatever the token says", async () => {
    const server = await app();

    const adminToken = await bearer(ADMIN, ["admin"]);
    expect(
      (
        await inject(server, {
          url: "/admin/audit",
          headers: adminToken
        })
      ).statusCode
    ).toBe(200);

    await setRole(ADMIN, "user");
    expect(
      (
        await inject(server, {
          url: "/admin/audit",
          headers: adminToken
        })
      ).statusCode
    ).toBe(403);
  });

  it("requires the admin scope on extension tokens", async () => {
    const server = await app();

    const syncToken = await bearer(ADMIN, ["sync"]);

    const res = await inject(server, {
      url: "/admin/audit",
      headers: syncToken
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: "ADMIN_SCOPE_REQUIRED" });
    expect((await inject(server, { url: "/admin/audit" })).statusCode).toBe(401);
  });

  it("changes a role, revokes admin tokens and records it in the audit log", async () => {
    await setRole(MEMBER, "admin");
    await bearer(MEMBER, ["admin"]);
    await database.db.insert(extensionToken).values({
      id: "sync-only",
      userId: MEMBER,
      tokenHash: "hash-sync",
      scopes: ["sync"],
      expiresAt: new Date(Date.now() + 60_000)
    });
    mockSession.userId = ADMIN;
    const server = await app();

    const res = await inject(server, {
      method: "PUT",
      url: `/admin/users/${MEMBER}/role`,
      payload: { role: "user" }
    });
    expect(res.json()).toEqual({
      role: "user",
      changed: true,
      revokedTokens: 1
    });
    expect((await database.db.select().from(extensionToken).where(isNull(extensionToken.revokedAt))).map((row) => row.id)).toEqual(["sync-only"]);

    const [event] = await database.db.select().from(adminAuditEvent);
    expect(event).toMatchObject({
      actorId: ADMIN,
      actorKind: "user",
      action: "user.role.update",
      targetType: "user",
      targetId: MEMBER,
      details: {
        from: "admin",
        to: "user",
        revokedTokens: 1
      }
    });
    expect((await inject(server, { url: "/admin/audit" })).json().events).toHaveLength(1);
  });

  it("searches users and grants or removes the verified badge with an audit entry", async () => {
    await database.db.update(user).set({ discordUsername: "memberhandle" }).where(eq(user.id, MEMBER));
    mockSession.userId = ADMIN;
    const server = await app();

    const found = await inject(server, { url: "/admin/users?q=memberhan" });
    expect(found.json().users).toEqual([
      expect.objectContaining({
        id: MEMBER,
        username: "memberhandle",
        verified: false
      })
    ]);
    expect((await inject(server, { url: "/admin/users?q=a" })).statusCode).toBe(400);

    const granted = await inject(server, {
      method: "PUT",
      url: `/admin/users/${MEMBER}/verified`,
      payload: { verified: true }
    });
    expect(granted.json()).toEqual({
      verified: true,
      changed: true
    });
    expect((await database.db.select({ verified: user.verified }).from(user).where(eq(user.id, MEMBER)))[0]?.verified).toBe(true);
    expect((await database.db.select().from(adminAuditEvent))[0]).toMatchObject({
      action: "user.verified.update",
      targetId: MEMBER
    });

    expect(
      (
        await inject(server, {
          method: "PUT",
          url: "/admin/users/nobody/verified",
          payload: { verified: true }
        })
      ).statusCode
    ).toBe(404);

    mockSession.userId = MEMBER;
    expect((await inject(server, { url: "/admin/users?q=memberhan" })).statusCode).toBe(403);
  });

  it("refuses self changes, unknown roles and unknown users", async () => {
    mockSession.userId = ADMIN;
    const server = await app();

    expect(
      (
        await inject(server, {
          method: "PUT",
          url: `/admin/users/${ADMIN}/role`,
          payload: { role: "user" }
        })
      ).statusCode
    ).toBe(409);
    expect(
      (
        await inject(server, {
          method: "PUT",
          url: `/admin/users/${MEMBER}/role`,
          payload: { role: "owner" }
        })
      ).statusCode
    ).toBe(400);
    expect(
      (
        await inject(server, {
          method: "PUT",
          url: "/admin/users/nobody/role",
          payload: { role: "admin" }
        })
      ).statusCode
    ).toBe(404);

    mockSession.userId = MEMBER;
    expect(
      (
        await inject(server, {
          method: "PUT",
          url: `/admin/users/${MEMBER}/role`,
          payload: { role: "admin" }
        })
      ).statusCode
    ).toBe(403);
    expect(await database.db.select().from(adminAuditEvent)).toEqual([]);
  });
});

describe("moderator role", () => {
  const MODERATOR = "moderator-1";

  const guarded = async () => {
    const { requireCapability } = await import("@/features/admin/admin.middleware");
    return mount(
      "/",
      new Hono<AppEnv>()
        .post("/review", requireCapability("review"), (c) => c.json({ ok: true }))
        .post("/publish", requireCapability("publish"), (c) => c.json({ ok: true }))
    );
  };

  beforeEach(async () => {
    await seedUser(database.db, MODERATOR);
    await setRole(MODERATOR, "moderator");
    mockSession.userId = MODERATOR;
  });

  it("can review but cannot publish, announce or manage roles", async () => {
    const routes = await guarded();
    expect(
      (
        await inject(routes, {
          method: "POST",
          url: "/review"
        })
      ).statusCode
    ).toBe(200);
    expect(
      (
        await inject(routes, {
          method: "POST",
          url: "/publish"
        })
      ).statusCode
    ).toBe(403);

    const server = await app();
    expect((await inject(server, { url: "/me" })).json()).toMatchObject({
      role: "moderator",
      capabilities: ["review"]
    });
    expect(
      (
        await inject(server, {
          method: "POST",
          url: "/announcements",
          payload: ANNOUNCEMENT
        })
      ).statusCode
    ).toBe(403);
    expect(
      (
        await inject(server, {
          method: "PUT",
          url: `/admin/users/${MEMBER}/role`,
          payload: { role: "moderator" }
        })
      ).statusCode
    ).toBe(403);
    expect((await inject(server, { url: "/admin/audit" })).statusCode).toBe(403);
  });

  it("gets the admin token scope to review from the extension", async () => {
    const server = await app();

    const granted = await inject(server, {
      method: "POST",
      url: "/extension/tokens",
      payload: {
        scopes: ["admin"]
      }
    });
    expect(granted.statusCode).toBe(200);

    const routes = await guarded();

    const headers = { authorization: `Bearer ${granted.json().token}` };
    mockSession.userId = null;
    expect(
      (
        await inject(routes, {
          method: "POST",
          url: "/review",
          headers
        })
      ).statusCode
    ).toBe(200);
    expect(
      (
        await inject(routes, {
          method: "POST",
          url: "/publish",
          headers
        })
      ).statusCode
    ).toBe(403);
  });

  it("can be promoted or demoted by an admin", async () => {
    mockSession.userId = ADMIN;
    const server = await app();
    expect(
      (
        await inject(server, {
          method: "PUT",
          url: `/admin/users/${MEMBER}/role`,
          payload: { role: "moderator" }
        })
      ).json()
    ).toMatchObject({
      role: "moderator",
      changed: true
    });
    expect(
      (
        await inject(server, {
          method: "PUT",
          url: `/admin/users/${MODERATOR}/role`,
          payload: { role: "user" }
        })
      ).json()
    ).toMatchObject({
      role: "user",
      changed: true
    });
  });
});

describe("announcements by staff", () => {
  it("lets an account with the announce capability publish and audits who did it", async () => {
    vi.stubEnv("API_SECRET_KEY", "");
    const server = await app();

    mockSession.userId = MEMBER;
    expect(
      (
        await inject(server, {
          method: "POST",
          url: "/announcements",
          payload: ANNOUNCEMENT
        })
      ).statusCode
    ).toBe(403);

    mockSession.userId = ADMIN;
    const created = await inject(server, {
      method: "POST",
      url: "/announcements",
      payload: ANNOUNCEMENT
    });
    expect(created.statusCode).toBe(201);
    const [event] = await database.db.select().from(adminAuditEvent);
    expect(event).toMatchObject({
      actorId: ADMIN,
      action: "announcement.create",
      targetId: created.json().id
    });
  });

  it("keeps the shared secret for CI and audits it as such", async () => {
    vi.stubEnv("API_SECRET_KEY", "ci-secret");
    const server = await app();

    expect(
      (
        await inject(server, {
          method: "POST",
          url: "/announcements",
          headers: { authorization: "Bearer ci-secret" },
          payload: ANNOUNCEMENT
        })
      ).statusCode
    ).toBe(201);
    expect(await database.db.select().from(announcement)).toHaveLength(1);
    expect((await database.db.select().from(adminAuditEvent))[0]).toMatchObject({
      actorId: null,
      actorKind: "secret"
    });
  });

  it("keeps audit rows when the actor deletes their account and exports them", async () => {
    mockSession.userId = ADMIN;
    const server = await app();
    await inject(server, {
      method: "POST",
      url: "/announcements",
      payload: ANNOUNCEMENT
    });

    expect((await inject(server, { url: "/me/export" })).json().adminActions).toHaveLength(1);
    await inject(server, {
      method: "DELETE",
      url: "/me"
    });
    expect((await database.db.select().from(adminAuditEvent))[0]).toMatchObject({
      actorId: null,
      action: "announcement.create"
    });
  });
});