import { COPY_ID, effects, makeCopyFixture, originalActivity } from "./activity-publications.fixture";
import { beforeEach, describe, expect, it } from "vitest";
import { applyPublication } from "@/background/services/activity-publications";
import { getCustomActivities, setCustomActivities } from "@/background/storage/custom-activities.store";

let copy: Awaited<ReturnType<typeof makeCopyFixture>>;

describe("reviewed publication copies", () => {
  beforeEach(async () => {
    copy = await makeCopyFixture();
  });
  it("status and page opening never write local activities or expose content", async () => {
    expect(await copy.status()).toEqual({
      ok: true,
      installed: false,
      revision: null,
      modified: false,
      localFingerprint: null
    });
    expect(copy.storage.local).toEqual({});
    expect(effects.broadcast).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      `https://api.nowly.me/activity-publications/${COPY_ID}`,
      expect.objectContaining({
        credentials: "omit",
        redirect: "error"
      })
    );
  });
  it("installs independent disabled copies with detection off and is idempotent", async () => {
    expect(await applyPublication(copy.review)).toEqual({ ok: true });
    expect(await applyPublication(copy.review)).toEqual({ ok: true });
    const state = await getCustomActivities();
    expect(state.items).toHaveLength(1);
    expect(state.activeId).toBeNull();
    expect(state.items[0].id).not.toBe(originalActivity.id);
    expect(state.items[0].detectionUrl).toBe("");
    expect(state.items[0].provenance).toEqual({
      publicationId: COPY_ID,
      revision: 1,
      baseline: copy.publication.activity
    });
    expect(await copy.status()).toEqual(
      expect.objectContaining({
        ok: true,
        installed: true,
        revision: 1,
        modified: false
      })
    );
  });
  it("preserves local content and baseline on Keep, replaces only explicitly and stops the copy", async () => {
    await applyPublication(copy.review);
    const installed = await getCustomActivities();

    const local = {
      ...installed.items[0],
      name: "My local edit",
      detectionUrl: "private.example.com"
    };
    effects.detection.mockResolvedValue({ activityId: local.id });
    await setCustomActivities({
      items: [local],
      activeId: local.id,
      activatedAt: 100
    });
    await copy.advance();
    expect(await copy.status()).toEqual(
      expect.objectContaining({
        modified: true,
        revision: 1
      })
    );
    expect(await applyPublication(await copy.reviewedUpdate("keep"))).toEqual({ ok: true });
    expect((await getCustomActivities()).items[0]).toEqual(local);
    expect(await applyPublication(await copy.reviewedUpdate())).toEqual({ ok: true });
    const replaced = await getCustomActivities();
    expect(replaced.activeId).toBeNull();
    expect(replaced.activatedAt).toBeNull();
    expect(replaced.items[0]).toEqual(
      expect.objectContaining({
        id: local.id,
        name: "Publisher revision two",
        detectionUrl: "",
        provenance: {
          publicationId: COPY_ID,
          revision: 2,
          baseline: copy.publication.activity
        }
      })
    );
    expect(effects.dismiss).toHaveBeenCalledWith(local.id);
  });
  it("rejects unseen remote revisions and concurrent local edits", async () => {
    await applyPublication(copy.review);
    const update = await copy.reviewedUpdate();

    const state = await getCustomActivities();
    await setCustomActivities({
      ...state,
      items: [
        {
          ...state.items[0],
          name: "Concurrent edit"
        }
      ]
    });
    expect(await applyPublication(update)).toEqual({
      ok: false,
      error: "LOCAL_CHANGED"
    });
    await copy.advance();
    expect(await applyPublication(update)).toEqual({
      ok: false,
      error: "REVISION_CHANGED"
    });
    expect((await getCustomActivities()).items[0].name).toBe("Concurrent edit");
  });
  it("blocks replacement while an editor may hold an unsaved React draft", async () => {
    await applyPublication(copy.review);
    const update = await copy.reviewedUpdate();

    const state = await getCustomActivities();
    copy.storage.session.customActivityEditors = { "editor-document": state.items[0].id };
    expect(await applyPublication(update)).toEqual({
      ok: false,
      error: "EDITOR_OPEN"
    });
    expect(await getCustomActivities()).toEqual(state);
    expect(
      await applyPublication({
        ...update,
        choice: "keep"
      })
    ).toEqual({ ok: true });
  });
  it("enforces capacity and serializes simultaneous installs", async () => {
    const full = {
      items: Array.from({ length: 50 }, (_, index) => ({
        ...originalActivity,
        id: String(index)
      })),
      activeId: null,
      activatedAt: null
    };
    await setCustomActivities(full);
    expect(await applyPublication(copy.review)).toEqual({
      ok: false,
      error: "LIMIT_REACHED"
    });
    await setCustomActivities({
      items: [],
      activeId: null,
      activatedAt: null
    });
    expect(
      await Promise.all([
        applyPublication(copy.review),
        applyPublication(copy.review)
      ])
    ).toEqual([
      { ok: true },
      { ok: true }
    ]);
    expect((await getCustomActivities()).items).toHaveLength(1);
  });
  it("rejects arbitrary payloads and never fetches a page-provided URL", async () => {
    expect(
      (
        await applyPublication({
          ...copy.review,
          id: "https://evil.example"
        })
      ).ok
    ).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
    copy.publication.activity.largeImage = {
      kind: "embedded",
      dataUrl: "data:image/png;base64,PGh0bWw+"
    };
    expect((await applyPublication(copy.review)).ok).toBe(false);
    expect((await getCustomActivities()).items).toHaveLength(0);
  });
});