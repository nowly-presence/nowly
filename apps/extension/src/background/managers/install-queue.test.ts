import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { drainQueuedInstalls, enqueueInstall, getInstallQueue, INSTALL_QUEUE_ALARM, INSTALL_QUEUE_KEY, removeQueuedInstall } from "./install-queue";

const deferred = <T>() => {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

beforeEach(() => {
  vi.useFakeTimers();
  let items: unknown = [];
  let alarm = false;
  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: async () => ({ [INSTALL_QUEUE_KEY]: structuredClone(items) }),
        set: async (values: Record<string, unknown>) => {
          items = structuredClone(values[INSTALL_QUEUE_KEY]);
        }
      }
    },
    alarms: {
      get: vi.fn(async () => (alarm ? { name: INSTALL_QUEUE_ALARM } : undefined)),
      create: vi.fn(async () => {
        alarm = true;
      }),
      clear: vi.fn(async () => {
        alarm = false;
      })
    }
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("presence install queue", () => {
  it("keeps new requests and skips overlapping drains while a download is pending", async () => {
    await enqueueInstall("presence", "extension");
    const original = (await getInstallQueue())[0];
    const started = deferred<void>();
    const finished = deferred<{
      ok: boolean;
      status: number;
    }>();
    const install = vi.fn(() => {
      started.resolve();
      return finished.promise;
    });

    const drain = drainQueuedInstalls(install);
    await started.promise;
    const overlapping = drainQueuedInstalls(install);
    await Promise.all([
      enqueueInstall("presence", "extension"),
      enqueueInstall("other", "web")
    ]);
    finished.resolve({
      ok: false,
      status: 404
    });

    const [remaining, overlappingRemaining] = await Promise.all([drain, overlapping]);
    expect(install).toHaveBeenCalledExactlyOnceWith(original);
    expect(remaining).toEqual(overlappingRemaining);
    expect(remaining.map(({ slug, source }) => ({ slug, source }))).toEqual([
      {
        slug: "other",
        source: "web"
      },
      {
        slug: "presence",
        source: "extension"
      }
    ]);
    expect(remaining[1].queuedAt).toBeGreaterThan(original.queuedAt);
    expect(chrome.alarms.create).toHaveBeenCalledOnce();
    expect(chrome.alarms.clear).not.toHaveBeenCalled();
  });

  it("removes finished requests, retains temporary failures, and clears the alarm after the last removal", async () => {
    await Promise.all([
      enqueueInstall("success"),
      enqueueInstall("gone"),
      enqueueInstall("retry")
    ]);
    const remaining = await drainQueuedInstalls(async ({ slug }) => {
      if (slug === "success") return {
        ok: true
      };

      return {
        ok: false,
        status: slug === "gone" ? 404 : 503
      };
    });
    expect(remaining.map(({ slug }) => slug)).toEqual(["retry"]);
    expect(chrome.alarms.clear).not.toHaveBeenCalled();

    await removeQueuedInstall("retry");
    expect(await getInstallQueue()).toEqual([]);
    expect(chrome.alarms.clear).toHaveBeenCalledExactlyOnceWith(INSTALL_QUEUE_ALARM);
  });
});