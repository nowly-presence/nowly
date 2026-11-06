import { adminAuditEvent } from "@nowly/database/schema/admin";
import { user } from "@nowly/database/schema/auth";
import { presenceReport } from "@nowly/database/schema/report";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDatabase, seedExtensionToken, seedUser, type TestDatabase } from "./database";
import { inject, mount } from "./http";

vi.mock("@/features/auth/better-auth", () => ({
  getAuth: () => ({
    api: { getSession: vi.fn(async () => null) }
  })
}));

const storage = vi.hoisted(() => ({
  enabled: true,
  puts: [] as string[],
  deletes: [] as string[]
}));

vi.mock("@/shared/object-storage", () => ({
  hasObjectStorage: () => storage.enabled,
  publicObjectUrl: (key: string) => `https://cdn.test/${key}`,
  objectStorage: () => ({
    send: vi.fn(
      async (command: {
        constructor: {
          name: string;
        };
        input: {
          Key?: string;
          Delete?: {
            Objects: Array<{
              Key: string;
            }>;
          };
        };
      }) => {
        if (command.constructor.name === "PutObjectCommand" && command.input.Key) storage.puts.push(command.input.Key);
        if (command.constructor.name === "DeleteObjectsCommand") storage.deletes.push(...(command.input.Delete?.Objects.map((entry) => entry.Key) ?? []));
        return {};
      }
    )
  })
}));

const KEY = "k".repeat(40);
const OTHER_KEY = "o".repeat(40);
const MODERATOR = "moderator-1";
const ADMIN = "admin-1";
const PLAIN = "plain-1";

let database: TestDatabase;
let moderator: Record<string, string>;
let admin: Record<string, string>;
let plain: Record<string, string>;

const app = async () => {
  const { presenceReportRoutes } = await import("@/features/presence-reports/presence-reports.routes");
  return mount("/", presenceReportRoutes);
};

const reporter = (key = KEY) => ({ "x-reporter-key": key });

const call = async (method: string, url: string, headers: Record<string, string>, payload?: unknown) => inject(await app(), { method, url, headers, payload });

const create = (overrides: Record<string, unknown> = {}, key = KEY) =>
  call("POST", "/presence-reports", reporter(key), {
    slug: "youtube",
    message: "Title is wrong in fullscreen",
    anonymous: true,
    notify: true,
    locale: "fr-FR",
    browser: "Chrome",
    ...overrides
  });

beforeAll(async () => {
  database = await createTestDatabase();
});
afterAll(async () => {
  await database.close();
});
beforeEach(async () => {
  storage.enabled = true;
  storage.puts = [];
  storage.deletes = [];
  await database.reset();
  (await import("@/middleware/rate-limit")).resetRateLimits();

  for (const id of [MODERATOR, ADMIN, PLAIN]) await seedUser(database.db, id);

  await database.db.update(user).set({ role: "moderator" }).where(eq(user.id, MODERATOR));
  await database.db.update(user).set({ role: "admin" }).where(eq(user.id, ADMIN));
  moderator = {
    authorization: `Bearer ${await seedExtensionToken({
      userId: MODERATOR,
      scopes: ["admin"]
    })}`
  };
  admin = {
    authorization: `Bearer ${await seedExtensionToken({
      userId: ADMIN,
      scopes: ["admin"]
    })}`
  };
  plain = {
    authorization: `Bearer ${await seedExtensionToken({
      userId: PLAIN,
      scopes: ["sync"]
    })}`
  };
});

describe("presence reports", () => {
  it("creates a thread and lists it for the key holder only", async () => {
    const created = await create();

    expect(created.statusCode).toBe(201);
    expect(created.json().status).toBe("new");

    const mine = await call("GET", "/presence-reports", reporter());
    expect(mine.json().reports).toHaveLength(1);
    expect(mine.json().reports[0].lastMessage.body).toBe("Title is wrong in fullscreen");

    const theirs = await call("GET", "/presence-reports", reporter(OTHER_KEY));
    expect(theirs.json().reports).toHaveLength(0);

    const peek = await call("GET", `/presence-reports/${created.json().id}`, reporter(OTHER_KEY));
    expect(peek.statusCode).toBe(404);
  });

  it("requires a reporter key", async () => {
    const response = await call("GET", "/presence-reports", {});
    expect(response.statusCode).toBe(401);
  });

  it("hides the identity of an anonymous reporter from the team", async () => {
    await create();
    const list = await call("GET", "/admin/presence-reports", moderator);

    const [row] = list.json().reports;

    expect(row.reporterLabel).toBe("Anonyme");
    expect(JSON.stringify(list.json())).not.toContain(KEY);

    const detail = await call("GET", `/admin/presence-reports/${row.id}`, moderator);
    expect(detail.json().messages[0].authorName).toBe("Anonyme");
    expect(JSON.stringify(detail.json())).not.toMatch(/secretHash|deviceId|reporterId/);
  });

  it("shows the chosen label when the reporter is not anonymous", async () => {
    await create({
      anonymous: false,
      label: "alice",
      labelSource: "discord_link"
    });
    const [row] = (await call("GET", "/admin/presence-reports", moderator)).json().reports;
    expect(row.reporterLabel).toBe("alice");
  });

  it("keeps internal notes away from the reporter", async () => {
    const { id } = (await create()).json();
    await call("POST", `/admin/presence-reports/${id}/messages`, moderator, {
      message: "secret theory",
      visibility: "internal"
    });
    await call("POST", `/admin/presence-reports/${id}/messages`, moderator, { message: "We are looking into it" });

    const reporterView = await call("GET", `/presence-reports/${id}`, reporter());
    const bodies = reporterView.json().messages.map((message: { body: string }) => message.body);

    expect(bodies).toContain("We are looking into it");
    expect(JSON.stringify(reporterView.json())).not.toContain("secret theory");

    const staffView = await call("GET", `/admin/presence-reports/${id}`, moderator);
    expect(JSON.stringify(staffView.json())).toContain("secret theory");
  });

  it("keeps a signed-in reporter thread away from another account on the same browser", async () => {
    const { id } = (
      await call(
        "POST",
        "/presence-reports",
        { ...reporter(), ...plain },
        {
          slug: "youtube",
          message: "Mine",
          anonymous: true,
          notify: false
        }
      )
    ).json();

    const sameKeyOtherAccount = await call("GET", `/presence-reports/${id}`, { ...reporter(), ...admin });
    expect(sameKeyOtherAccount.statusCode).toBe(404);
    expect((await call("GET", "/presence-reports", { ...reporter(), ...admin })).json().reports).toHaveLength(0);

    expect((await call("GET", `/presence-reports/${id}`, { ...reporter(OTHER_KEY), ...plain })).statusCode).toBe(200);
    expect((await call("GET", `/presence-reports/${id}`, reporter())).statusCode).toBe(200);
    expect((await call("GET", `/presence-reports/${id}`, reporter(OTHER_KEY))).statusCode).toBe(404);
  });

  it("limits report creation per IP even when the reporter key changes", async () => {
    const statuses: number[] = [];
    const mounted = await app();

    for (let index = 0; index < 32; index += 1)
      statuses.push(
        (
          await inject(mounted, {
            method: "POST",
            url: "/presence-reports",
            headers: reporter(`${index}`.padStart(40, "x")),
            payload: {
              slug: "youtube",
              message: "Spam",
              anonymous: true,
              notify: false
            }
          })
        ).statusCode
      );

    expect(statuses.slice(0, 30).every((code) => code === 201)).toBe(true);
    expect(statuses[31]).toBe(429);
  });

  it("attaches an internal note to a message and rejects unknown targets", async () => {
    const { id } = (await create()).json();
    const detail = (await call("GET", `/admin/presence-reports/${id}`, moderator)).json();
    const first = detail.messages[0];

    const noted = await call("POST", `/admin/presence-reports/${id}/messages`, moderator, {
      message: "Likely the player rework",
      visibility: "internal",
      noteOn: first.id
    });
    expect(noted.statusCode).toBe(201);
    expect(noted.json().messages.find((message: { kind: string }) => message.kind === "note").answerTo).toBe(first.id);

    const unknown = await call("POST", `/admin/presence-reports/${id}/messages`, moderator, {
      message: "x",
      visibility: "internal",
      noteOn: "missing"
    });
    expect(unknown.statusCode).toBe(409);

    const publicTarget = await call("POST", `/admin/presence-reports/${id}/messages`, moderator, {
      message: "x",
      noteOn: first.id
    });
    expect(publicTarget.statusCode).toBe(400);
  });

  it("moves through info request, answer and fixed, writing status markers", async () => {
    const { id } = (await create()).json();

    const asked = await call("POST", `/admin/presence-reports/${id}/messages`, moderator, {
      message: "Also on Shorts?",
      choices: ["Yes", "No"]
    });

    const request = asked.json().messages.find((message: { kind: string }) => message.kind === "info_request");
    expect(request.choices).toEqual(["Yes", "No"]);
    expect(request.authorName).toBe(MODERATOR);

    const awaiting = await call("GET", `/presence-reports/${id}`, reporter());
    expect(awaiting.json().report.status).toBe("info_requested");

    const answered = await call("POST", `/presence-reports/${id}/messages`, reporter(), {
      message: "Yes",
      answerTo: request.id
    });
    expect(answered.statusCode).toBe(201);
    expect((await call("GET", `/presence-reports/${id}`, reporter())).json().report.status).toBe("in_progress");

    await call("POST", `/admin/presence-reports/${id}/messages`, admin, {
      message: "Fixed in 1.4.2",
      statusTo: "fixed"
    });
    const after = await call("GET", `/presence-reports/${id}`, reporter());
    expect(after.json().report.status).toBe("fixed");
    expect(
      after
        .json()
        .messages.filter((message: { kind: string }) => message.kind === "status_change")
        .map((message: { statusTo: string }) => message.statusTo)
    ).toEqual(["info_requested", "in_progress", "fixed"]);
  });

  it("rejects an answer to a message that is not an info request", async () => {
    const { id } = (await create()).json();
    const detail = await call("GET", `/presence-reports/${id}`, reporter());

    const response = await call("POST", `/presence-reports/${id}/messages`, reporter(), {
      message: "hi",
      answerTo: detail.json().messages[0].id
    });
    expect(response.statusCode).toBe(409);
    expect(response.json().error).toBe("INVALID_ANSWER");
  });

  it("lets the reporter close and reopen, and blocks writes once closed", async () => {
    const { id } = (await create()).json();
    expect((await call("POST", `/presence-reports/${id}/close`, reporter())).json().status).toBe("closed");

    const blocked = await call("POST", `/presence-reports/${id}/messages`, reporter(), { message: "still there?" });
    expect(blocked.statusCode).toBe(409);

    expect((await call("POST", `/presence-reports/${id}/reopen`, reporter())).json().status).toBe("in_progress");
  });

  it("limits the open threads per key", async () => {
    for (let index = 0; index < 5; index += 1) {
      expect((await create({ message: `report ${index}` })).statusCode).toBe(201);
      await database.db.update(presenceReport).set({ lastMessageAt: new Date() });
    }

    const { resetRateLimits } = await import("@/middleware/rate-limit");
    resetRateLimits();
    const sixth = await create();
    expect(sixth.statusCode).toBe(429);
  });

  it("closes threads waiting for the reporter after the delay", async () => {
    const { id } = (await create()).json();
    await call("POST", `/admin/presence-reports/${id}/messages`, moderator, {
      message: "Details?",
      choices: ["A", "B"]
    });
    const { closeStaleReports } = await import("@/features/presence-reports/report.service");

    expect(await closeStaleReports(new Date())).toBe(0);
    expect(await closeStaleReports(new Date(Date.now() + 15 * 86_400_000))).toBe(1);
    expect((await call("GET", `/presence-reports/${id}`, reporter())).json().report.status).toBe("closed");
  });

  it("closes stale threads through the scheduler endpoint with the shared secret", async () => {
    vi.stubEnv("CREATOR_WEBHOOK_SECRET", "scheduler-secret");
    const { id } = (await create()).json();
    await call("POST", `/admin/presence-reports/${id}/messages`, moderator, {
      message: "Details?",
      choices: ["A", "B"]
    });
    await database.db.update(presenceReport).set({ autoCloseAt: new Date(Date.now() - 1000) });

    expect((await call("POST", "/presence-reports/close-stale", {})).statusCode).toBe(401);

    const response = await call("POST", "/presence-reports/close-stale", { authorization: "Bearer scheduler-secret" });
    expect(response.json().closed).toBe(1);
    vi.unstubAllEnvs();
  });

  it("reports updates since a date", async () => {
    const { id } = (await create()).json();
    const since = new Date(Date.now() + 1000).toISOString();
    expect((await call("GET", `/presence-reports/updates?since=${encodeURIComponent(since)}`, reporter())).json().reports).toHaveLength(0);
    await call("POST", `/admin/presence-reports/${id}/messages`, moderator, { message: "Hello" });
    const all = await call("GET", "/presence-reports/updates", reporter());
    expect(all.json().reports[0].unread).toBe(true);
  });

  it("guards the staff routes by capability and audits actions", async () => {
    const { id } = (await create()).json();

    expect((await call("GET", "/admin/presence-reports", plain)).statusCode).toBe(403);
    expect((await call("GET", "/admin/presence-reports", {})).statusCode).toBe(401);
    expect((await call("DELETE", `/admin/presence-reports/${id}`, moderator)).statusCode).toBe(403);

    await call("POST", `/admin/presence-reports/${id}/messages`, moderator, { message: "hi" });
    expect((await call("DELETE", `/admin/presence-reports/${id}`, admin)).statusCode).toBe(200);

    const actions = (await database.db.select().from(adminAuditEvent)).map((event) => event.action);
    expect(actions).toEqual(expect.arrayContaining(["report.status", "report.delete"]));
  });

  it("stores image attachments for both sides and removes them with the thread", async () => {
    const png = await sharp({
      create: {
        width: 40,
        height: 30,
        channels: 3,
        background: "#336699"
      }
    })
      .png()
      .toBuffer();

    const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
    const { id } = (await create()).json();

    const sent = await call("POST", `/presence-reports/${id}/messages`, reporter(), {
      message: "screenshot",
      attachments: [dataUrl]
    });
    expect(sent.statusCode).toBe(201);
    const withImage = sent.json().messages.find((message: { attachments: string[] }) => message.attachments.length > 0);
    expect(withImage.attachments[0]).toMatch(/^https:\/\/cdn\.test\/reports\/.+\.png$/);
    expect(storage.puts).toHaveLength(1);

    const staff = await call("POST", `/admin/presence-reports/${id}/messages`, moderator, {
      message: "see this",
      attachments: [dataUrl]
    });
    expect(staff.statusCode).toBe(201);
    expect(storage.puts).toHaveLength(2);

    await call("DELETE", `/admin/presence-reports/${id}`, admin);
    expect(storage.deletes.sort()).toEqual([...storage.puts].sort());
  });

  it("rejects attachments that are not real images or when storage is missing", async () => {
    const { id } = (await create()).json();
    const fake = `data:image/png;base64,${Buffer.from("not an image").toString("base64")}`;
    const bad = await call("POST", `/presence-reports/${id}/messages`, reporter(), {
      message: "x",
      attachments: [fake]
    });
    expect(bad.statusCode).toBe(422);
    expect(bad.json().error).toBe("INVALID_ATTACHMENT");

    const png = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: "#000"
      }
    })
      .png()
      .toBuffer();
    storage.enabled = false;
    const noStorage = await call("POST", `/presence-reports/${id}/messages`, reporter(), {
      message: "x",
      attachments: [`data:image/png;base64,${png.toString("base64")}`]
    });
    expect(noStorage.statusCode).toBe(503);

    const stranger = await call("POST", `/presence-reports/${id}/messages`, reporter(OTHER_KEY), {
      message: "x",
      attachments: [fake]
    });
    expect(stranger.statusCode).toBe(404);
  });

  it("exports and erases the threads of an account, including their files", async () => {
    const png = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: "#123456"
      }
    })
      .png()
      .toBuffer();

    const owned = await call(
      "POST",
      "/presence-reports",
      { ...reporter(), ...plain },
      {
        slug: "youtube",
        message: "mine",
        anonymous: false,
        label: "plain",
        labelSource: "discord_link",
        notify: false
      }
    );

    const id = owned.json().id as string;
    await call(
      "POST",
      `/presence-reports/${id}/messages`,
      { ...reporter(), ...plain },
      {
        message: "with image",
        attachments: [`data:image/png;base64,${png.toString("base64")}`]
      }
    );
    await create({ message: "someone else" }, OTHER_KEY);

    const { exportReporterReports } = await import("@/features/presence-reports/report.service");

    const exported = await exportReporterReports(PLAIN);
    expect(exported).toHaveLength(1);
    expect(exported[0].messages.map((message) => message.body)).toEqual(["mine", "with image"]);

    const { deleteAccountData } = await import("@/features/account/account.service");
    await deleteAccountData(PLAIN);

    const remaining = await database.db.select().from(presenceReport);
    expect(remaining).toHaveLength(1);
    expect(storage.deletes).toHaveLength(1);
  });
});