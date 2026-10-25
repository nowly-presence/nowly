import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InstalledPresences, StoredPresence } from "@/shared/types";
import { sendMessage } from "@/lib/messages";
import { usePresenceActions } from "./use-presence-actions";

const effects = vi.hoisted(() => ({
  toast: vi.fn(),
  presences: vi.fn(),
  updates: vi.fn()
}));
let presences: InstalledPresences = {};
let updates: Record<string, string> = {};
const events: string[] = [];
const gates = new Map<
  string,
  Promise<{
    ok: boolean;
    error?: string;
  }>
>();

vi.mock("@/hooks/extension-state-provider", () => ({
  useExtensionState: () => ({
    state: { presences, updates },
    refresh: {
      presences: effects.presences,
      updates: effects.updates
    }
  })
}));
vi.mock("@/hooks/i18n-provider", () => ({
  useI18n: () => ({
    t: (
      key: string,
      params?: {
        name: string;
      }
    ) => (params ? `${key}:${params.name}` : key),
    locale: "fr"
  })
}));
vi.mock("@/ui/toast", () => ({
  useToast: () => ({ toast: effects.toast })
}));
vi.mock("@/lib/messages", () => ({
  sendMessage: vi.fn(),
  track: vi.fn()
}));

const stored = (slug: string, source?: StoredPresence["source"]): StoredPresence => {
  const metadata: StoredPresence["metadata"] = {
    slug,
    name: slug,
    author: { name: "Fixture" },
    description: { en: "Fixture" },
    url: ["example.test"],
    color: "#000000",
    category: "other"
  };
  return {
    source,
    metadata,
    enabled: true,
    installedAt: 1,
    release: {
      slug,
      version: "1",
      metadata,
      bundle: "",
      sha256: "",
      metadataHash: "",
      signature: "",
      signedAt: ""
    }
  };
};

const deferred = <T>() => {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: Error) => void = () => {};
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
};

const renderHooks = () => {
  const instances: ReturnType<typeof usePresenceActions>[] = [];
  const Probe = () => {
    instances.push(usePresenceActions());
    return null;
  };
  renderToStaticMarkup(createElement(Fragment, null, createElement(Probe), createElement(Probe)));
  const [activity, detail] = instances;

  if (!activity || !detail) throw new Error("Missing real React hook instances");

  return { activity, detail };
};

const installedSlugs = () => events.filter((event) => event.startsWith("install:")).map((event) => event.slice("install:".length));

const waitForFirst = async () => vi.waitFor(() => expect(installedSlugs()).toEqual(["first"]));

describe("bulk presence updates with real React hook instances", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gates.clear();
    events.length = 0;
    presences = {
      first: stored("first", "store"),
      second: stored("second")
    };
    updates = {
      first: "2",
      second: "2"
    };
    effects.presences.mockResolvedValue(undefined);
    effects.updates.mockResolvedValue(undefined);
    const runtime = async (type: string, payload?: {
      slug?: string;
    }) => {
      const slug = payload?.slug ?? "";

      if (type === "GET_PRESENCES") return structuredClone(presences);
      if (type === "CHECK_UPDATES") return { ...updates };
      if (type === "UNINSTALL_PRESENCE") {
        events.push(`uninstall:${slug}`);
        delete presences[slug];
        delete updates[slug];
        return {
          ok: true
        };
      }
      if (type === "INSTALL_PRESENCE_FROM_API") {
        events.push(`install:${slug}`);
        const result = await (gates.get(slug) ?? Promise.resolve({ ok: true }));

        if (result.ok) {
          presences[slug] ??= stored(slug);
          presences[slug].release.version = "2";
          delete updates[slug];
        }

        events.push(`settled:${slug}`);
        return result;
      }

      throw new Error(`Unexpected message ${type}`);
    };
    vi.mocked(sendMessage).mockImplementation(runtime as typeof sendMessage);
  });

  it.each([0, 1])("does not start a batch for %s eligible updates", async (count) => {
    updates = count ? { first: "2" } : {};
    expect(await renderHooks().activity.updateAll()).toBeUndefined();
    expect(installedSlugs()).toEqual([]);
  });

  it("includes only installed store and legacy store presences and uses slug-only signed installation messages", async () => {
    presences.local = stored("local", "local");
    presences.bundle = stored("bundle", "bundle");
    presences.current = stored("current", "store");
    updates = {
      ...updates,
      local: "2",
      bundle: "2",
      unknown: "2"
    };
    const { activity } = renderHooks();
    expect(activity.availableUpdates.map(([slug]) => slug)).toEqual(["first", "second"]);
    expect(await activity.updateAll()).toEqual({
      succeeded: ["first", "second"],
      failed: []
    });
    expect(installedSlugs()).toEqual(["first", "second"]);
    expect(sendMessage).toHaveBeenCalledWith("INSTALL_PRESENCE_FROM_API", { slug: "first" });
    expect(sendMessage).toHaveBeenCalledWith("INSTALL_PRESENCE_FROM_API", { slug: "second" });
  });

  it("revalidates a removed queued presence after an async wait and a real React rerender", async () => {
    const gate = deferred<{
      ok: boolean;
    }>();
    gates.set("first", gate.promise);
    const batch = renderHooks().activity.updateAll();
    await waitForFirst();
    const removal = renderHooks().detail.uninstall("second", "second");
    gate.resolve({ ok: true });
    await Promise.all([batch, removal]);
    expect(installedSlugs()).toEqual(["first"]);
    expect(presences.second).toBeUndefined();
  });

  it.each(["local", "bundle", "current", "absent"])("checks authoritative eligibility when the queued target becomes %s", async (kind) => {
    const gate = deferred<{
      ok: boolean;
    }>();
    gates.set("first", gate.promise);
    const batch = renderHooks().activity.updateAll();
    await waitForFirst();
    if (kind === "local" || kind === "bundle") presences.second = stored("second", kind);
    if (kind === "current") delete updates.second;
    if (kind === "absent") delete presences.second;
    gate.resolve({ ok: true });
    await batch;
    expect(installedSlugs()).toEqual(["first"]);
  });

  it("joins the pending bulk update from a different detail hook instance after rerender", async () => {
    const gate = deferred<{
      ok: boolean;
    }>();
    gates.set("first", gate.promise);
    const batch = renderHooks().activity.updateAll();
    await waitForFirst();
    expect(renderHooks().detail.isPending("first")).toBe(true);
    const detail = renderHooks().detail.update("first", "first");
    await Promise.resolve();
    const overlapping = [...installedSlugs()];
    gate.resolve({ ok: true });
    await Promise.all([batch, detail]);
    expect(overlapping).toEqual(["first"]);
    expect(installedSlugs()).toEqual(["first", "second"]);
    expect(renderHooks().detail.isPending("first")).toBe(false);
    expect(effects.toast.mock.calls.filter(([message]) => message === "toast.updated:first")).toHaveLength(1);
  });

  it("preserves explicit uninstall intent when an installation is already in flight", async () => {
    const gate = deferred<{
      ok: boolean;
    }>();
    gates.set("first", gate.promise);
    const update = renderHooks().activity.update("first", "first");
    await waitForFirst();
    const removal = renderHooks().detail.uninstall("first", "first");
    gate.resolve({ ok: true });
    await Promise.all([update, removal]);
    expect(events).toEqual(["install:first", "settled:first", "uninstall:first"]);
    expect(presences.first).toBeUndefined();
    expect(effects.toast.mock.calls).not.toContainEqual(["toast.updated:first", "success"]);
  });

  it("joins an install request to a pending update across real hook instances", async () => {
    const gate = deferred<{
      ok: boolean;
    }>();
    gates.set("first", gate.promise);
    const update = renderHooks().activity.update("first", "first");
    await waitForFirst();
    const install = renderHooks().detail.install("first", "first");
    await Promise.resolve();
    const overlapping = [...installedSlugs()];
    gate.resolve({ ok: true });
    await Promise.all([update, install]);
    expect(overlapping).toEqual(["first"]);
    expect(installedSlugs()).toEqual(["first"]);
  });

  it("cancels before dispatch when uninstall is requested during authoritative validation", async () => {
    const validation = deferred<Record<string, string>>();
    vi.mocked(sendMessage).mockImplementationOnce(() => validation.promise);
    const update = renderHooks().activity.update("first", "first");
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith("CHECK_UPDATES"));
    const removal = renderHooks().detail.uninstall("first", "first");
    validation.resolve({ first: "2" });
    await Promise.all([update, removal]);
    expect(installedSlugs()).toEqual([]);
    expect(presences.first).toBeUndefined();
  });

  it("does not update an installed release already matching the checked version", async () => {
    presences.first.release.version = "2";
    await renderHooks().activity.update("first", "first");
    expect(installedSlugs()).toEqual([]);
  });

  it("cancels a stale batch target even after an explicit uninstall and reinstall", async () => {
    const gate = deferred<{
      ok: boolean;
    }>();
    gates.set("first", gate.promise);
    const batch = renderHooks().activity.updateAll();
    await waitForFirst();
    const removal = renderHooks().detail.uninstall("second", "second");
    gate.resolve({ ok: true });
    await removal;
    await renderHooks().detail.install("second", "second");
    await batch;
    expect(installedSlugs().filter((slug) => slug === "second")).toHaveLength(1);
  });

  it("waits for both refresh callbacks before starting the next update", async () => {
    const firstRefresh = deferred<void>();
    const secondRefresh = deferred<void>();
    effects.presences.mockReturnValueOnce(firstRefresh.promise);
    effects.updates.mockReturnValueOnce(secondRefresh.promise);
    const batch = renderHooks().activity.updateAll();
    await vi.waitFor(() => expect(effects.updates).toHaveBeenCalledOnce());
    firstRefresh.resolve();
    await Promise.resolve();
    expect(installedSlugs()).toEqual(["first"]);
    secondRefresh.resolve();
    expect(await batch).toEqual({
      succeeded: ["first", "second"],
      failed: []
    });
  });

  it("rejects repeated clicks synchronously", async () => {
    const gate = deferred<{
      ok: boolean;
    }>();
    gates.set("first", gate.promise);
    const { activity } = renderHooks();
    const batch = activity.updateAll();
    expect(await activity.updateAll()).toBeUndefined();
    await waitForFirst();
    gate.resolve({ ok: true });
    await batch;
    expect(installedSlugs()).toEqual(["first", "second"]);
  });

  it("continues after signature failures and exceptions, refreshes and permits retry", async () => {
    gates.set(
      "first",
      Promise.resolve({
        ok: false,
        error: "RELEASE_SIGNATURE_INVALID"
      })
    );
    const rejection = deferred<{
      ok: boolean;
    }>();
    gates.set("second", rejection.promise);
    const batch = renderHooks().activity.updateAll();
    await vi.waitFor(() => expect(installedSlugs()).toEqual(["first", "second"]));
    rejection.reject(new Error("Transport unavailable"));
    expect(await batch).toEqual({
      succeeded: [],
      failed: ["first", "second"]
    });
    expect(effects.toast.mock.calls).toEqual([
      ["error.signature", "error"],
      ["error.generic", "error"]
    ]);
    expect(effects.presences).toHaveBeenCalledTimes(2);
    expect(effects.updates).toHaveBeenCalledTimes(2);
    expect(updates).toEqual({
      first: "2",
      second: "2"
    });
    gates.clear();
    expect(await renderHooks().activity.updateAll()).toEqual({
      succeeded: ["first", "second"],
      failed: []
    });
  });
});