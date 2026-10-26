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

  it("filters non-store presences, handles batch update lifecycle, and prevents duplicate executions", async () => {
    // 0/1 eligible updates
    updates = { first: "2" };
    expect(await renderHooks().activity.updateAll()).toBeUndefined();
    expect(installedSlugs()).toEqual([]);

    // Filters local/bundle presences
    presences.local = stored("local", "local");
    presences.bundle = stored("bundle", "bundle");
    updates = {
      first: "2",
      second: "2",
      local: "2",
      bundle: "2"
    };

    const { activity } = renderHooks();
    expect(activity.availableUpdates.map(([slug]) => slug)).toEqual(["first", "second"]);
    expect(await activity.updateAll()).toEqual({
      succeeded: ["first", "second"],
      failed: []
    });
    expect(installedSlugs()).toEqual(["first", "second"]);
  });

  it("coordinates async mutations, overlapping hooks, and in-flight uninstalls", async () => {
    const gate = deferred<{
      ok: boolean;
    }>();
    gates.set("first", gate.promise);

    const batch = renderHooks().activity.updateAll();
    await waitForFirst();

    // Check pending state across hooks
    expect(renderHooks().detail.isPending("first")).toBe(true);

    // Uninstall during in-flight installation
    const removal = renderHooks().detail.uninstall("first", "first");
    gate.resolve({ ok: true });
    await Promise.all([batch, removal]);

    expect(presences.first).toBeUndefined();
    expect(renderHooks().detail.isPending("first")).toBe(false);
  });

  it("handles errors, signature validation failures, and retries gracefully", async () => {
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
  });
});