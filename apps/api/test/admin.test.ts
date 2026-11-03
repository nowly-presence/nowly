import { adminAuditEvent } from "@nowly/database/schema/admin";
import { extensionToken } from "@nowly/database/schema/account";
import { announcement } from "@nowly/database/schema/announcement";
import { user } from "@nowly/database/schema/auth";
import { eq, isNull } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDatabase, seedExtensionToken, seedUser, type TestDatabase } from "./database";
import { inject, mount } from "./http";

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