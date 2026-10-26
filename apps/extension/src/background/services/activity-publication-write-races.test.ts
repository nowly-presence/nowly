import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupRecovery, id, publicId, key, blocked, fixtureFetch, backend } from "./activity-publication-recovery.fixture";
import { publishActivity, getOwnedPublication } from "@/background/services/activity-publication-publisher";
import { deleteCustomActivity } from "@/background/managers/custom-activity-manager";

describe("durable publication write ordering", () => {
  beforeEach(async () => {
    await setupRecovery();
  });
  it("serializes local deletion behind an in-flight PUT", async () => {
    let release: (value: Response) => void = () => undefined;
    let started: () => void = () => undefined;
    const putStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    const pending = new Promise<Response>((resolve) => {
      release = resolve;
    });
    vi.mocked(fetch).mockImplementation(async (url, init) => {
      if (init?.method === "PUT") {
        started();
        return pending;
      }
      if (init?.method === "POST") return fixtureFetch(url, init);

      return Response.json({ id: publicId });
    });
    const publishing = publishActivity(id, 0);
    await putStarted;
    const deleting = deleteCustomActivity(id);
    expect(vi.mocked(fetch).mock.calls.map(([, init]) => init?.method)).toEqual(["POST", "PUT"]);
    release(
      Response.json({
        id: publicId,
        revision: 1
      })
    );
    expect((await publishing).ok).toBe(true);
    expect(await deleting).toEqual({
      ok: false,
      error: "PUBLICATION_ACTIVE"
    });
  });
  it("keeps unresolved attempts blocked after a fresh worker import", async () => {
    vi.mocked(fetch).mockImplementationOnce(fixtureFetch).mockRejectedValueOnce(new Error("lost response"));
    expect((await publishActivity(id, 0)).ok).toBe(false);
    vi.resetModules();
    const fresh = await import("@/background/managers/custom-activity-manager");
    vi.mocked(fetch).mockResolvedValue(Response.json({ error: "UNPUBLISHED" }, { status: 404 }));
    expect(await fresh.deleteCustomActivity(id)).toEqual(blocked);
  });
  it("recovers the same reservation after a lost reservation response without an unknown-id PUT", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("reservation response lost"));
    expect((await publishActivity(id, 0)).ok).toBe(false);
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({
        publication: {
          id: publicId,
          revision: 0,
          published: false
        }
      })
    );
    expect((await getOwnedPublication(id)).ok).toBe(true);
    expect((await publishActivity(id, 0)).ok).toBe(true);
    const methods = vi.mocked(fetch).mock.calls.map(([, init]) => init?.method ?? "GET");
    expect(methods).toEqual(["POST", "GET", "PUT"]);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[2][1]?.body)).id).toBe(publicId);
    const stored = await chrome.storage.local.get("activityPublicationAttempts");
    expect(stored.activityPublicationAttempts).toEqual({
      [key]: {
        id: publicId,
        apiBase: "https://api.nowly.me",
        pending: true
      }
    });
  });
  it("pins the backend across reservation and publication even if configuration changes mid-flight", async () => {
    vi.mocked(fetch).mockImplementation(async (url, init) => {
      if (init?.method === "POST") backend.api = "https://other.example";
      return fixtureFetch(url, init);
    });
    expect((await publishActivity(id, 0)).ok).toBe(true);
    expect(vi.mocked(fetch).mock.calls.map(([url]) => url)).toEqual([
      `https://api.nowly.me/me/activity-publications/${id}`,
      `https://api.nowly.me/me/activity-publications/${id}`
    ]);
    const stored = await chrome.storage.local.get("activityPublicationAttempts");
    expect(stored.activityPublicationAttempts).toEqual({
      [key]: {
        id: publicId,
        apiBase: "https://api.nowly.me",
        pending: true
      }
    });
    vi.mocked(fetch).mockClear();
    expect(await deleteCustomActivity(id)).toEqual(blocked);
    expect(fetch).not.toHaveBeenCalled();
  });
});