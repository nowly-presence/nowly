import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupRecovery, id, publicId, key, account, activity, absent, blocked, fixtureFetch, backend } from "./activity-publication-recovery.fixture";
import { publishActivity, getOwnedPublication } from "@/background/services/activity-publication-publisher";
import { deleteCustomActivity } from "@/background/managers/custom-activity-manager";
import { setCustomActivities, getCustomActivities } from "@/background/storage/custom-activities.store";
import { setAccount } from "@/background/storage/account.store";

let storage: Awaited<ReturnType<typeof setupRecovery>>;

describe("erased-publisher recovery", () => {
  beforeEach(async () => {
    storage = await setupRecovery();
  });
  it.each([false, true])("deletes only a freshly missing row after erasure, recreated same Discord: %s", async (recreated) => {
    await publishActivity(id, 0);
    await chrome.storage.local.set({ account: null });
    if (recreated) await setAccount({
      ...account,
      user: {
        ...account.user,
        id: "new-owner"
      }
    });
    vi.mocked(fetch).mockReset().mockResolvedValue(absent());
    expect(await deleteCustomActivity(id)).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(`https://api.nowly.me/activity-publications/${publicId}`, {
      cache: "no-store",
      credentials: "omit",
      redirect: "error"
    });
    expect((await getCustomActivities()).items).toEqual([]);
    expect(storage.local.activityPublicationAttempts).toHaveProperty(key);
  });
  it("keeps a still-public source without authentication", async () => {
    await publishActivity(id, 0);
    await chrome.storage.local.set({ account: null });
    vi.mocked(fetch).mockResolvedValue(Response.json({ id: publicId }));
    expect(await deleteCustomActivity(id)).toEqual({
      ok: false,
      error: "PUBLICATION_ACTIVE"
    });
    expect((await getCustomActivities()).items).toEqual([activity]);
  });
  it.each([
    () => Response.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 }),
    () => new Response("<html>404</html>", { status: 404 }),
    () => Response.json({ message: "Route not found" }, { status: 404 }),
    () =>
      Response.json(
        {
          error: "NOT_FOUND",
          extra: true
        },
        { status: 404 }
      ),
    () =>
      new Response("{", {
        status: 404,
        headers: { "content-type": "application/json" }
      }),
    () =>
      Response.json(
        {
          error: "NOT_FOUND",
          padding: "x".repeat(256)
        },
        { status: 404 }
      ),
    () =>
      new Response(null, {
        status: 302,
        headers: { location: "https://other.example" }
      })
  ])("does not treat invalid absence as erasure", async (response) => {
    await publishActivity(id, 0);
    vi.mocked(fetch).mockResolvedValue(response());
    expect(await deleteCustomActivity(id)).toEqual(blocked);
    expect((await getCustomActivities()).items).toEqual([activity]);
  });
  it("blocks unresolved PUT against an unpublished reservation, but permits explicit revision-zero withdrawal", async () => {
    vi.mocked(fetch).mockImplementationOnce(fixtureFetch).mockRejectedValueOnce(new Error("lost PUT"));
    expect((await publishActivity(id, 0)).ok).toBe(false);
    vi.mocked(fetch).mockResolvedValue(Response.json({ error: "UNPUBLISHED" }, { status: 404 }));
    expect(await deleteCustomActivity(id)).toEqual(blocked);
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({
        id: publicId,
        revision: 1
      })
    );
    expect((await publishActivity(id, 0, true)).ok).toBe(true);
    vi.mocked(fetch).mockImplementation(async (url) =>
      String(url).includes("/me/")
        ? Response.json({
            publication: {
              id: publicId,
              revision: 1,
              published: false
            }
          })
        : Response.json({ error: "UNPUBLISHED" }, { status: 404 })
    );
    expect(await deleteCustomActivity(id)).toEqual({ ok: true });
  });
  it("cannot use another backend's 404, or overwrite references after an API change", async () => {
    await publishActivity(id, 0);
    const before = structuredClone(storage.local.activityPublicationAttempts);
    backend.api = "https://other.example";
    vi.mocked(fetch).mockClear().mockResolvedValue(absent());
    expect(await deleteCustomActivity(id)).toEqual(blocked);
    expect((await getOwnedPublication(id)).ok).toBe(false);
    expect((await publishActivity(id, 1)).ok).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
    expect(storage.local.activityPublicationAttempts).toEqual(before);
  });
  it("checks every owner's known id and fails closed on unknown or mismatched references", async () => {
    await publishActivity(id, 0);
    const otherKey = `old-owner:${id}`;
    const reference = {
      id: "b".repeat(32),
      apiBase: backend.api,
      pending: true
    };
    await chrome.storage.local.set({
      activityPublicationAttempts: {
        [key]: {
          ...reference,
          id: publicId
        },
        [otherKey]: reference
      }
    });
    vi.mocked(fetch)
      .mockReset()
      .mockResolvedValueOnce(absent())
      .mockResolvedValueOnce(Response.json({ id: reference.id }));
    expect(await deleteCustomActivity(id)).toEqual({
      ok: false,
      error: "PUBLICATION_ACTIVE"
    });
    expect(fetch).toHaveBeenCalledTimes(2);

    for (const state of [
      { [key]: true },
      { [key]: reference },
      {}
    ]) {
      await chrome.storage.local.set({ activityPublicationAttempts: state });
      vi.mocked(fetch).mockClear();
      expect(await deleteCustomActivity(id)).toEqual(blocked);
      expect(fetch).not.toHaveBeenCalled();
    }
  });
  it("never publishes if the reservation response or durable reference write is lost", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("lost reservation"));
    expect((await publishActivity(id, 0)).ok).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(await deleteCustomActivity(id)).toEqual({ ok: true });
    await setCustomActivities({
      items: [activity],
      activeId: null,
      activatedAt: null
    });
    const set = vi.spyOn(chrome.storage.local, "set").mockRejectedValueOnce(new Error("storage full"));
    vi.mocked(fetch).mockReset().mockImplementation(fixtureFetch);
    expect((await publishActivity(id, 0)).ok).toBe(false);
    expect(vi.mocked(fetch).mock.calls.map(([, init]) => init?.method)).toEqual(["POST"]);
    set.mockRestore();
  });
  it("requires proof for all recorded links, not just the recreated account's null lookup", async () => {
    await publishActivity(id, 0);
    await setAccount({
      ...account,
      user: {
        ...account.user,
        id: "new-owner"
      }
    });
    vi.mocked(fetch).mockResolvedValue(Response.json({ publication: null }));
    expect(await deleteCustomActivity(id)).toEqual({
      ok: false,
      error: "PUBLICATION_ACTIVE"
    });
    vi.mocked(fetch).mockResolvedValue(Response.json({ error: "UNPUBLISHED" }, { status: 404 }));
    expect(await deleteCustomActivity(id)).toEqual(blocked);
    expect((await getCustomActivities()).items).toEqual([activity]);
  });
});