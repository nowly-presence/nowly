import { user } from "@nowly/database/schema/auth";
import { presenceSubmission, presenceSubmissionEvent, presenceSubmissionRevision } from "@nowly/database/schema/creator";
import { creatorDefinition, presenceSlug } from "@nowly/presence-creator";
import { sampleCreatorDraft } from "@nowly/presence-creator/creator-fixtures";
import { eq } from "drizzle-orm";
import { generateKeyPairSync } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDatabase, seedUser, type TestDatabase } from "./database";
import { inject, mount } from "./http";

const storage = vi.hoisted(() => ({ objects: new Map<string, Buffer>() }));

vi.mock("@/shared/object-storage", () => ({
  hasObjectStorage: () => true,
  objectStorage: () => ({
    send: vi.fn(
      async (command: {
        input: {
          Key?: string;
        };
      }) => {
        const bytes = command.input.Key ? storage.objects.get(command.input.Key) : undefined;
        return {
          Body: bytes ? { transformToByteArray: async () => new Uint8Array(bytes) } : undefined
        };
      }
    )
  }),
  publicObjectUrl: (key: string) => `https://cdn.test/${key}`
}));

const AUTHOR = "author-1";
const ADMIN = "admin-1";
const SECRET = "creator-webhook-test";
const SUBMISSION = "a1b2c3d4e5f6a7b8c9d0e1f2";
const PR_NUMBER = 42;
const SAMPLE = {
  ...creatorDefinition(sampleCreatorDraft()),
  id: "abcd1234",
  author: {
    name: AUTHOR,
    discord: "1234"
  }
};
const slug = presenceSlug(SAMPLE.name);
const folder = `src/${SAMPLE.name.charAt(0).toUpperCase()}/${SAMPLE.name}`;

const keys = (revision: number) => ({
  thumbnail: `creator/${SUBMISSION}/${revision}/thumbnail.jpg`,
  logo: `creator/${SUBMISSION}/${revision}/logo.png`,
  icon: `creator/${SUBMISSION}/${revision}/icon.png`
});

type Call = {
  method: string;
  path: string;
  body: Record<string, unknown> | undefined;
};

const github = {
  calls: [] as Call[],
  existing: new Set<string>(),
  branches: new Set<string>(),
  openPulls: new Map<string, number>(),
  failTrees: false
};

const json = (status: number, body: unknown) =>
  new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });

const fakeGithub = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
  const url = new URL(String(input));
  const method = init?.method ?? "GET";
  const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
  const path = decodeURIComponent(url.pathname);

  if (url.hostname === "api.cloudflare.com") {
    const items: Array<{
      key: string;
      text: string;
    }> = JSON.parse(body.messages[1].content);
    const locale = /to (\w\w-\w\w)/.exec(String(body.messages[0].content))?.[1];
    return json(200, {
      success: true,
      result: {
        response: {
          items: items.map((item) => ({
            key: item.key,
            text: `[${locale}] ${item.text}`
          }))
        }
      }
    });
  }

  github.calls.push({
    method,
    path: `${path}${url.search}`,
    body
  });
  const repo = "/repos/nowly-presence/presences";

  if (path.startsWith("/app/installations/")) return json(201, { token: "installation-token" });
  if (method === "GET" && path.startsWith(`${repo}/contents/`)) {
    const file = path.slice(`${repo}/contents/`.length);
    const children = [...github.existing].filter((item) => item.startsWith(`${file}/`));

    if (github.existing.has(file)) return json(200, {
      path: file,
      type: "file"
    });
    if (children.length) return json(
      200,
      children.map((item) => ({
        path: item,
        type: "file"
      }))
    );

    return json(404, { message: "Not Found" });
  }
  if (method === "POST" && path === `${repo}/git/blobs`) return json(201, { sha: `blob-${github.calls.length}` });
  if (method === "GET" && path === `${repo}/git/ref/heads/stable`) return json(200, {
    object: { sha: "base-commit" }
  });
  if (method === "GET" && path === `${repo}/git/commits/base-commit`) return json(200, {
    tree: { sha: "base-tree" }
  });
  if (method === "POST" && path === `${repo}/git/trees`) return github.failTrees ? json(500, { message: "boom" }) : json(201, { sha: "new-tree" });
  if (method === "POST" && path === `${repo}/git/commits`) return json(201, { sha: `commit-${github.calls.length}` });
  if (method === "POST" && path === `${repo}/git/refs`) {
    const branch = String(body?.ref).replace("refs/heads/", "");

    if (github.branches.has(branch)) return json(422, { message: "Reference already exists" });

    github.branches.add(branch);
    return json(201, {});
  }
  if (method === "PATCH" && path.startsWith(`${repo}/git/refs/heads/`)) return json(200, {});
  if (method === "GET" && path === `${repo}/pulls`) {
    const head = (url.searchParams.get("head") ?? "").split(":")[1];
    const number = github.openPulls.get(head);
    return json(
      200,
      number
        ? [
            {
              number,
              html_url: `https://github.com/nowly-presence/presences/pull/${number}`
            }
          ]
        : []
    );
  }
  if (method === "POST" && path === `${repo}/pulls`) {
    github.openPulls.set(String(body?.head), PR_NUMBER);
    return json(201, {
      number: PR_NUMBER,
      html_url: `https://github.com/nowly-presence/presences/pull/${PR_NUMBER}`
    });
  }
  if (method === "POST" && path.startsWith(`${repo}/issues/`)) return json(200, []);

  return json(500, { message: `unexpected ${method} ${path}` });
};

let database: TestDatabase;

const app = async () => mount("/", (await import("@/features/presence-submissions/presence-submissions.routes")).presenceSubmissionRoutes);

const runJob = async () =>
  (
    await inject(await app(), {
      method: "POST",
      url: "/presence-submissions/pull-requests",
      headers: { authorization: `Bearer ${SECRET}` }
    })
  ).json();

const addRevision = async (number: number, status = "in_progress") => {
  await database.db.insert(presenceSubmissionRevision).values({
    id: `rev-${number}`,
    submissionId: SUBMISSION,
    number,
    authorId: AUTHOR,
    definition: SAMPLE,
    assets: keys(number)
  });
  await database.db
    .update(presenceSubmission)
    .set({
      revision: number,
      status
    })
    .where(eq(presenceSubmission.id, SUBMISSION));

  for (const key of Object.values(keys(number))) storage.objects.set(key, Buffer.from(`image ${key}`));
};

const stored = async () => (await database.db.select().from(presenceSubmission).where(eq(presenceSubmission.id, SUBMISSION)))[0];

const callsTo = (method: string, suffix: string) => github.calls.filter((call) => call.method === method && call.path.endsWith(suffix));

beforeAll(async () => {
  database = await createTestDatabase();
});
beforeEach(async () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  vi.stubEnv("CREATOR_WEBHOOK_SECRET", SECRET);
  vi.stubEnv("FRONTEND_URL", "https://nowly.me");
  vi.stubEnv("ACCOUNT_URL", "https://account.nowly.me");
  vi.stubEnv("NOLO_APP_ID", "1");
  vi.stubEnv("NOLO_INSTALLATION_ID", "2");
  vi.stubEnv(
    "NOLO_PRIVATE_KEY",
    privateKey
      .export({
        type: "pkcs8",
        format: "pem"
      })
      .toString()
  );
  vi.stubGlobal("fetch", vi.fn(fakeGithub));
  Object.assign(github, {
    calls: [],
    existing: new Set(),
    branches: new Set(),
    openPulls: new Map(),
    failTrees: false
  });
  storage.objects.clear();
  await database.reset();
  await seedUser(database.db, AUTHOR);
  await seedUser(database.db, ADMIN);
  await database.db.update(user).set({ discordId: "1234" }).where(eq(user.id, AUTHOR));
  await database.db.insert(presenceSubmission).values({
    id: SUBMISSION,
    draftId: SAMPLE.id,
    authorId: AUTHOR,
    kind: "create",
    slug,
    status: "in_progress",
    revision: 1
  });
  await addRevision(1);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
afterAll(() => database.close());

describe("Nolo pull request job", () => {
  it("commits the regenerated files and images on a creator branch and opens one pull request", async () => {
    expect(await runJob()).toEqual({
      opened: 1,
      collision: 0,
      skipped: 0,
      failed: 0
    });

    const [tree] = callsTo("POST", "/git/trees");
    const paths = (
      tree.body?.tree as Array<{
        path: string;
        content?: string;
        sha?: string;
      }>
    ).map((entry) => entry.path);
    expect(tree.body?.base_tree).toBe("base-tree");
    expect(paths).toEqual(
      expect.arrayContaining([
        `${folder}/metadata.json`,
        `${folder}/presence.ts`,
        `${folder}/locales/en-US.json`,
        `${folder}/assets/thumbnail.jpg`,
        `${folder}/assets/logo.png`,
        `${folder}/assets/icon.png`
      ])
    );
    expect(callsTo("POST", "/git/blobs").map((call) => Buffer.from(String(call.body?.content), "base64").toString())).toEqual(
      Object.values(keys(1)).map((key) => `image ${key}`)
    );
    expect(callsTo("POST", "/git/commits")[0].body).toMatchObject({
      parents: ["base-commit"],
      message: `feat(${slug}): add ${SAMPLE.name} from the creator`
    });
    expect(callsTo("POST", "/git/refs")[0].body).toMatchObject({ ref: `refs/heads/creator/${slug}-${SUBMISSION.slice(0, 8)}` });

    const [pull] = callsTo("POST", "/pulls");
    expect(pull.body).toMatchObject({
      base: "stable",
      head: `creator/${slug}-${SUBMISSION.slice(0, 8)}`
    });
    expect(String(pull.body?.body)).toContain("https://discord.com/users/1234");
    expect(callsTo("POST", `/issues/${PR_NUMBER}/labels`)[0].body).toEqual({
      labels: ["presence", "creator"]
    });

    expect(await stored()).toMatchObject({
      status: "in_progress",
      prNumber: PR_NUMBER,
      prRevision: 1,
      prClaimedAt: null,
      prError: null
    });
    const events = await database.db.select().from(presenceSubmissionEvent);
    expect(events).toEqual([
      expect.objectContaining({
        type: "pr.opened",
        revision: 1,
        details: expect.objectContaining({ pr: PR_NUMBER })
      })
    ]);

    github.calls = [];
    expect(await runJob()).toEqual({
      opened: 0,
      collision: 0,
      skipped: 0,
      failed: 0
    });
    expect(github.calls).toEqual([]);
  });

  it("never overwrites an existing folder for a new presence", async () => {
    github.existing.add(`${folder}/metadata.json`);
    expect((await runJob()).collision).toBe(1);
    expect(await stored()).toMatchObject({
      status: "changes_requested",
      prNumber: null
    });
    expect((await stored()).note).toContain(SAMPLE.name);
    expect(callsTo("POST", "/git/trees")).toEqual([]);
  });

  it("keeps the error and retries on the next run", async () => {
    github.failTrees = true;
    expect((await runJob()).failed).toBe(1);
    expect(await stored()).toMatchObject({
      prNumber: null,
      prClaimedAt: null,
      prError: expect.stringContaining("500")
    });

    github.failTrees = false;
    expect((await runJob()).opened).toBe(1);
    expect((await stored()).prError).toBeNull();
  });

  it("force-pushes a new revision to the same branch and reuses the open pull request", async () => {
    await runJob();
    await addRevision(2);
    github.calls = [];

    expect((await runJob()).opened).toBe(1);
    expect(callsTo("PATCH", `/git/refs/heads/creator/${slug}-${SUBMISSION.slice(0, 8)}`)[0].body).toMatchObject({ force: true });
    expect(callsTo("POST", "/pulls")).toEqual([]);
    expect(await stored()).toMatchObject({
      prNumber: PR_NUMBER,
      prRevision: 2
    });
  });

  it("removes locales dropped from an update of a creator presence", async () => {
    await database.db.update(presenceSubmission).set({ kind: "update" }).where(eq(presenceSubmission.id, SUBMISSION));
    github.existing.add(`${folder}/metadata.json`);
    github.existing.add(`${folder}/locales/de-DE.json`);
    expect((await runJob()).opened).toBe(1);
    const entries = callsTo("POST", "/git/trees")[0].body?.tree as Array<{
      path: string;
      sha?: string | null;
    }>;
    expect(entries).toContainEqual(
      expect.objectContaining({
        path: `${folder}/locales/de-DE.json`,
        sha: null
      })
    );
  });

  it("does nothing without the GitHub app or outside the publishing status", async () => {
    await database.db.update(presenceSubmission).set({ status: "approved" }).where(eq(presenceSubmission.id, SUBMISSION));
    expect((await runJob()).opened).toBe(0);

    await database.db.update(presenceSubmission).set({ status: "in_progress" }).where(eq(presenceSubmission.id, SUBMISSION));
    vi.stubEnv("NOLO_APP_ID", "");
    expect(await runJob()).toEqual({
      opened: 0,
      collision: 0,
      skipped: 0,
      failed: 0
    });
    expect(github.calls).toEqual([]);
  });

  it("translates an automatic submission before committing and waits while translation is not configured", async () => {
    await database.db.update(presenceSubmission).set({ translate: true }).where(eq(presenceSubmission.id, SUBMISSION));
    expect((await runJob()).failed).toBe(1);
    expect((await stored()).prError).toBe("Automatic translation is not configured.");

    vi.stubEnv("WORKERS_AI_API_TOKEN", "token");
    vi.stubEnv("WORKERS_AI_ACCOUNT_ID", "account");
    expect((await runJob()).opened).toBe(1);
    const entries = callsTo("POST", "/git/trees")[0].body?.tree as Array<{
      path: string;
      content?: string;
    }>;
    const french = entries.find((entry) => entry.path === `${folder}/locales/fr-FR.json`);
    expect(french?.content).toContain("[fr-FR]");
    expect(entries.map((entry) => entry.path)).toContain(`${folder}/locales/es-ES.json`);
  });

  it("lets an admin retry one submission and refuses the job route without the secret", async () => {
    const server = await app();
    expect(
      (
        await inject(server, {
          method: "POST",
          url: "/presence-submissions/pull-requests"
        })
      ).statusCode
    ).toBe(401);
    expect(
      (
        await inject(server, {
          method: "POST",
          url: `/presence-submissions/${SUBMISSION}/pull-request`
        })
      ).statusCode
    ).toBe(401);
  });
});