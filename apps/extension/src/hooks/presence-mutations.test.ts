import { describe, expect, it, vi } from "vitest";
import { createPresenceMutations } from "./presence-mutations";

const deferred = () => {
  let resolve = () => {};
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

describe("shared presence mutation coordination", () => {
  it("joins same-slug install/update promises and serializes all mutating writes", async () => {
    const coordinator = createPresenceMutations();
    const gate = deferred();
    const first = vi.fn(async () => {
      await gate.promise;
      return true;
    });
    const duplicate = vi.fn(async () => true);
    const next = vi.fn(async () => true);
    const started = coordinator.write("first", first);
    expect(coordinator.write("first", duplicate)).toBe(started);
    const second = coordinator.write("second", next);
    await Promise.resolve();
    expect(first).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
    gate.resolve();
    expect(await started).toBe(true);
    expect(await second).toBe(true);
    expect(duplicate).not.toHaveBeenCalled();
    expect(coordinator.getSnapshot().size).toBe(0);
  });

  it("invalidates a queued target immediately and retains cancellation across uninstall/reinstall", async () => {
    const coordinator = createPresenceMutations();
    const gate = deferred();
    const blocking = coordinator.write("first", async () => {
      await gate.promise;
      return true;
    });
    const oldRevision = coordinator.revision("second");
    const queuedAction = vi.fn(async () => true);
    const queued = coordinator.write("second", queuedAction, oldRevision);
    const remove = vi.fn(async () => {});
    const removal = coordinator.remove("second", remove);
    const duplicateRemoval = coordinator.remove("second", remove);
    expect(duplicateRemoval).toBe(removal);
    expect(await coordinator.write("second", queuedAction)).toBeUndefined();
    gate.resolve();
    await blocking;
    expect(await queued).toBeUndefined();
    await removal;
    expect(remove).toHaveBeenCalledOnce();
    expect(await coordinator.write("second", async () => true)).toBe(true);
    expect(await coordinator.write("second", queuedAction, oldRevision)).toBeUndefined();
    expect(queuedAction).not.toHaveBeenCalled();
  });

  it("checks cancellation after asynchronous validation before any install dispatch", async () => {
    const coordinator = createPresenceMutations();
    const validated = deferred();
    const install = vi.fn();
    const write = coordinator.write("first", async (isCurrent) => {
      await validated.promise;

      if (!isCurrent()) return;

      install();
      return true;
    });
    await Promise.resolve();
    const removal = coordinator.remove("first", async () => {});
    validated.resolve();
    expect(await write).toBeUndefined();
    await removal;
    expect(install).not.toHaveBeenCalled();
  });

  it("uninstall follows an in-flight install and suppresses its stale success result", async () => {
    const coordinator = createPresenceMutations();
    const gate = deferred();
    const events: string[] = [];
    const write = coordinator.write("first", async () => {
      events.push("install");
      await gate.promise;
      events.push("installed");
      return true;
    });
    await Promise.resolve();
    const removal = coordinator.remove("first", async () => {
      events.push("uninstall");
    });
    gate.resolve();
    expect(await write).toBeUndefined();
    await removal;
    expect(events).toEqual(["install", "installed", "uninstall"]);
  });

  it("cleans subscriptions and pending snapshots even when writes and removals reject", async () => {
    const coordinator = createPresenceMutations();
    const listener = vi.fn();
    const unsubscribe = coordinator.subscribe(listener);
    const initial = coordinator.getSnapshot();
    expect(coordinator.getSnapshot()).toBe(initial);
    await expect(
      coordinator.write("first", async () => {
        throw new Error("write failed");
      })
    ).rejects.toThrow("write failed");
    expect(coordinator.getSnapshot().size).toBe(0);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    await expect(
      coordinator.remove("first", async () => {
        throw new Error("remove failed");
      })
    ).rejects.toThrow("remove failed");
    expect(listener).toHaveBeenCalledTimes(2);
    expect(coordinator.getSnapshot().size).toBe(0);
    expect(await coordinator.write("first", async () => true)).toBe(true);
  });
});