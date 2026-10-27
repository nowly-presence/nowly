import { beforeEach, describe, expect, it, vi } from "vitest";
import { publishActivity } from "@/background/services/activity-publication-publisher";
import { deleteCustomActivity } from "@/background/managers/custom-activity-manager";
import { getCustomActivities, setCustomActivities } from "@/background/storage/custom-activities.store";
import { setAccount } from "@/background/storage/account.store";
import { emptyCustomActivityDraft } from "@/shared/custom-activity";
import { installChromeMock } from "@/test/chrome-mock";
import { getCustomActivityDeletionPlan } from "@/background/services/custom-activity-deletion-plan";

vi.mock("@/background/managers/activity-manager", () => ({ broadcastActiveTab: vi.fn() }));
vi.mock("@/background/services/custom-assets-api", () => ({
  deleteCustomAsset: vi.fn(),
  touchCustomAsset: vi.fn(),
  uploadCustomAsset: vi.fn()
}));
vi.mock("@/background/services/api-state", () => ({
  getEffectiveApiUrl: () => "https://api.nowly.me",
  getEffectiveWebUrl: () => "https://nowly.me"
}));

const LOCAL_ID = "8b3f2e7c-5a0d-4c1e-9f6b-2d7a1c3e4f50";
const PUBLIC_ID = "a".repeat(32);
const account = {
  token: "nxt_fixture",
  user: {
    id: "publisher",
    name: "Verified",
    image: null,
    discordId: "discord"
  },
  scopes: ["sync", "creator"] as ("sync" | "creator")[],
  expiresAt: Date.now() + 60_000,
  connectedAt: 1
};
const activity = {
  ...emptyCustomActivityDraft(() => 0),
  id: LOCAL_ID,
  name: "Published source",
  createdAt: 1,
  updatedAt: 1
};
let published: boolean;
let revision: number;
let storage: ReturnType<typeof installChromeMock>;

const fixtureFetch = async (_url: unknown, init?: RequestInit): Promise<Response> => {
  if (init?.method === "POST") return Response.json({
    id: PUBLIC_ID,
    revision: 0,
    published: false
  });
  if (init?.method === "PUT" || init?.method === "DELETE") {
    published = init.method === "PUT";
    revision += 1;
    return Response.json({
      id: PUBLIC_ID,
      revision
    });
  }

  if (String(_url).includes("/activity-publications/") && !String(_url).includes("/me/")) {
    return published
      ? Response.json({ id: PUBLIC_ID })
      : Response.json({ error: "UNPUBLISHED" }, { status: 404 });
  }

  return Response.json({
    publication: {
      id: PUBLIC_ID,
      revision,
      published
    }
  });
};

describe("published local source deletion", () => {
  beforeEach(async () => {
    storage = installChromeMock();
    published = false;
    revision = 0;
    await setAccount(account);
    await setCustomActivities({
      items: [activity],
      activeId: LOCAL_ID,
      activatedAt: 100
    });
    vi.stubGlobal("fetch", vi.fn(fixtureFetch));
  });
  it("blocks deletion until explicit unpublish succeeds, without silently unpublishing", async () => {
    expect((await publishActivity(LOCAL_ID, 0)).ok).toBe(true);
    expect(await deleteCustomActivity(LOCAL_ID)).toEqual({
      ok: false,
      error: "PUBLICATION_ACTIVE"
    });
    expect(published).toBe(true);
    expect((await getCustomActivities()).items).toEqual([activity]);
    expect(vi.mocked(fetch).mock.calls.map(([, init]) => init?.method ?? "GET")).toEqual(["POST", "PUT", "GET"]);
    expect((await publishActivity(LOCAL_ID, 1, true)).ok).toBe(true);
    expect(published).toBe(false);
    expect(await deleteCustomActivity(LOCAL_ID)).toEqual({ ok: true });
    expect(await getCustomActivities()).toEqual({
      items: [],
      activeId: null,
      activatedAt: null
    });
  });
  it("plans two confirmations without withdrawing or deleting, then permits deletion after withdrawal", async () => {
    await publishActivity(LOCAL_ID, 0);
    vi.mocked(fetch).mockClear();
    expect(await getCustomActivityDeletionPlan(LOCAL_ID)).toEqual({
      ok: true,
      withdrawal: { revision: 1 }
    });
    expect(vi.mocked(fetch).mock.calls.every(([, init]) => !init?.method)).toBe(true);
    expect(published).toBe(true);
    expect((await getCustomActivities()).items).toEqual([activity]);
    await publishActivity(LOCAL_ID, 1, true);
    expect(await getCustomActivityDeletionPlan(LOCAL_ID)).toEqual({
      ok: true,
      withdrawal: null
    });
    expect((await getCustomActivities()).items).toEqual([activity]);
    expect(await deleteCustomActivity(LOCAL_ID)).toEqual({ ok: true });
  });
  it("plans direct deletion offline without a creator account for never-published activities", async () => {
    await setAccount({
      ...account,
      scopes: ["sync"]
    });
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    expect(await getCustomActivityDeletionPlan(LOCAL_ID)).toEqual({
      ok: true,
      withdrawal: null
    });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("plans explicit withdrawal of an unfinished reservation", async () => {
    vi.mocked(fetch).mockImplementationOnce(fixtureFetch).mockRejectedValueOnce(new Error("lost PUT"));
    await publishActivity(LOCAL_ID, 0);
    expect(await getCustomActivityDeletionPlan(LOCAL_ID)).toEqual({
      ok: true,
      withdrawal: { revision: 0 }
    });
    expect(await deleteCustomActivity(LOCAL_ID)).toEqual({
      ok: false,
      error: "PUBLICATION_CHECK_REQUIRED"
    });
    expect((await publishActivity(LOCAL_ID, 0, true)).ok).toBe(true);
    expect(await getCustomActivityDeletionPlan(LOCAL_ID)).toEqual({
      ok: true,
      withdrawal: null
    });
  });
  it("blocks planning when verification or publishing permission is unavailable", async () => {
    await publishActivity(LOCAL_ID, 0);
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    expect((await getCustomActivityDeletionPlan(LOCAL_ID)).ok).toBe(false);
    await setAccount({
      ...account,
      scopes: ["sync"]
    });
    expect(await getCustomActivityDeletionPlan(LOCAL_ID)).toEqual({
      ok: false,
      error: "CREATOR_REQUIRED"
    });
    expect((await getCustomActivities()).items).toEqual([activity]);
  });
  it("plans direct deletion after confirmed account erasure without old creator permission", async () => {
    await publishActivity(LOCAL_ID, 0);
    await setAccount({
      ...account,
      scopes: ["sync"]
    });
    vi.mocked(fetch).mockClear();
    vi.mocked(fetch).mockResolvedValue(Response.json({ error: "NOT_FOUND" }, { status: 404 }));
    expect(await getCustomActivityDeletionPlan(LOCAL_ID)).toEqual({
      ok: true,
      withdrawal: null
    });
    expect(fetch).toHaveBeenCalledOnce();
    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.headers).toBeUndefined();
    expect((await getCustomActivities()).items).toEqual([activity]);
  });
  it("preserves source and activation offline, after failed unpublish and without creator permission", async () => {
    await publishActivity(LOCAL_ID, 0);
    const before = await getCustomActivities();
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    expect(await deleteCustomActivity(LOCAL_ID)).toEqual({
      ok: false,
      error: "PUBLICATION_CHECK_REQUIRED"
    });
    expect((await publishActivity(LOCAL_ID, 1, true)).ok).toBe(false);
    expect(await getCustomActivities()).toEqual(before);
    await setAccount({
      ...account,
      scopes: ["sync"]
    });
    vi.mocked(fetch).mockClear();
    expect(await deleteCustomActivity(LOCAL_ID)).toEqual({
      ok: false,
      error: "PUBLICATION_CHECK_REQUIRED"
    });
    expect(fetch).toHaveBeenCalledOnce();
    expect(await getCustomActivities()).toEqual(before);
  });
  it("retains owner control even when publication committed but its response was lost", async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(fixtureFetch)
      .mockImplementationOnce(async () => {
        published = true;
        revision = 1;
        throw new Error("response lost");
      });
    expect((await publishActivity(LOCAL_ID, 0)).ok).toBe(false);
    expect(storage.local.activityPublicationAttempts).toEqual({
      [`publisher:${LOCAL_ID}`]: {
        id: PUBLIC_ID,
        apiBase: "https://api.nowly.me",
        pending: true
      }
    });
    expect(await deleteCustomActivity(LOCAL_ID)).toEqual({
      ok: false,
      error: "PUBLICATION_ACTIVE"
    });
    expect((await getCustomActivities()).items).toEqual([activity]);
  });
  it("verifies fresh server state even after a locally recorded unpublish", async () => {
    await publishActivity(LOCAL_ID, 0);
    await publishActivity(LOCAL_ID, 1, true);
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline after unpublish"));
    expect(await deleteCustomActivity(LOCAL_ID)).toEqual({
      ok: false,
      error: "PUBLICATION_CHECK_REQUIRED"
    });
    expect((await getCustomActivities()).items).toEqual([activity]);
    published = true;
    revision = 3;
    expect(await deleteCustomActivity(LOCAL_ID)).toEqual({
      ok: false,
      error: "PUBLICATION_ACTIVE"
    });
    expect((await getCustomActivities()).items).toEqual([activity]);
  });
  it("requires the publishing owner and leaves never-published local deletion offline", async () => {
    await publishActivity(LOCAL_ID, 0);
    await setAccount({
      ...account,
      user: {
        ...account.user,
        id: "other-account"
      }
    });
    expect(await deleteCustomActivity(LOCAL_ID)).toEqual({
      ok: false,
      error: "PUBLICATION_ACTIVE"
    });
    const localOnly = {
      ...activity,
      id: "local-only"
    };
    await setCustomActivities({
      items: [activity, localOnly],
      activeId: null,
      activatedAt: null
    });
    vi.mocked(fetch).mockClear();
    expect(await deleteCustomActivity(localOnly.id)).toEqual({ ok: true });
    expect(fetch).not.toHaveBeenCalled();
  });
});