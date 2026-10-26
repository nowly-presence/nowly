import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOwnedPublication, publishActivity } from "@/background/services/activity-publication-publisher";
import { setAccount } from "@/background/storage/account.store";
import { setCustomActivities } from "@/background/storage/custom-activities.store";
import { emptyCustomActivityDraft } from "@/shared/custom-activity";
import { installChromeMock } from "@/test/chrome-mock";

vi.mock("@/background/services/api-state", () => ({
  getEffectiveApiUrl: () => "https://api.nowly.me",
  getEffectiveWebUrl: () => "https://nowly.me"
}));

const LOCAL_ID = "8b3f2e7c-5a0d-4c1e-9f6b-2d7a1c3e4f50";
const PUBLIC_ID = "b".repeat(32);
const account = {
  token: "nxt_local_fixture",
  user: {
    id: "account",
    name: "Verified",
    image: null,
    discordId: "discord"
  },
  scopes: ["sync", "creator"] as ("sync" | "creator")[],
  expiresAt: Date.now() + 60_000,
  connectedAt: 1
};
const saved = {
  ...emptyCustomActivityDraft(() => 0),
  id: LOCAL_ID,
  name: "Saved version",
  detectionUrl: "private.example.com",
  createdAt: 1,
  updatedAt: 1
};

describe("saved activity publishing", () => {
  beforeEach(async () => {
    installChromeMock();
    await setAccount(account);
    await setCustomActivities({
      items: [saved],
      activeId: LOCAL_ID,
      activatedAt: 100
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: unknown, init?: RequestInit) =>
        Response.json(init?.method === "POST" ? { id: PUBLIC_ID, revision: 0, published: false } : { id: PUBLIC_ID, revision: 1 })
      )
    );
  });
  it("uses saved content only, strips private fields and preserves one link through updates and unpublish", async () => {
    expect(await publishActivity(LOCAL_ID, 0)).toEqual({
      ok: true,
      url: `https://nowly.me/activities/${PUBLIC_ID}`,
      revision: 1,
      published: true
    });
    const request = vi.mocked(fetch).mock.calls[1];
    expect(request[0]).toBe(`https://api.nowly.me/me/activity-publications/${LOCAL_ID}`);
    const body = JSON.parse(String(request[1]?.body));
    expect(body.baseRevision).toBe(0);
    expect(body.activity.name).toBe("Saved version");

    for (const key of ["detectionUrl", "id", "author", "createdAt", "updatedAt", "provenance"]) {
      expect(body.activity).not.toHaveProperty(key);
    }

    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({
        id: PUBLIC_ID,
        revision: 2
      })
    );
    expect(await publishActivity(LOCAL_ID, 1)).toEqual({
      ok: true,
      url: `https://nowly.me/activities/${PUBLIC_ID}`,
      revision: 2,
      published: true
    });
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[2][1]?.body)).baseRevision).toBe(1);
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({
        id: PUBLIC_ID,
        revision: 3
      })
    );
    expect(await publishActivity(LOCAL_ID, 2, true)).toEqual({
      ok: true,
      url: `https://nowly.me/activities/${PUBLIC_ID}`,
      revision: 3,
      published: false
    });
    expect(vi.mocked(fetch).mock.calls[3]).toEqual([
      `https://api.nowly.me/me/activity-publications/${PUBLIC_ID}`,
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ baseRevision: 2 })
      })
    ]);
  });
  it("never publishes with sync permission alone or retries a revision conflict", async () => {
    await setAccount({
      ...account,
      scopes: ["sync"]
    });
    expect(await publishActivity(LOCAL_ID, 0)).toEqual({
      ok: false,
      error: "CREATOR_REQUIRED"
    });
    expect(fetch).not.toHaveBeenCalled();
    await setAccount(account);
    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 409 }));
    expect(await publishActivity(LOCAL_ID, 0)).toEqual({
      ok: false,
      error: "REVISION_CONFLICT"
    });
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("recovers server revision metadata explicitly when reopening the editor", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({
        publication: {
          id: PUBLIC_ID,
          revision: 4,
          published: false
        }
      })
    );
    expect(await getOwnedPublication(LOCAL_ID)).toEqual({
      ok: true,
      url: `https://nowly.me/activities/${PUBLIC_ID}`,
      revision: 4,
      published: false,
      hasChanges: true
    });
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({
        id: PUBLIC_ID,
        revision: 5
      })
    );
    await publishActivity(LOCAL_ID, 4);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body)).baseRevision).toBe(4);
  });
  it("does not silently advance another publisher editor's optimistic revision", async () => {
    expect((await publishActivity(LOCAL_ID, 0)).ok).toBe(true);
    expect(await publishActivity(LOCAL_ID, 0)).toEqual({
      ok: false,
      error: "REVISION_CONFLICT"
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});