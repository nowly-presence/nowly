type WriteAction = (isCurrent: () => boolean) => Promise<boolean | undefined>;

export const createPresenceMutations = () => {
  const revisions = new Map<string, number>();
  const writes = new Map<
    string,
    {
      revision: number;
      promise: Promise<boolean | undefined>;
    }
  >();
  const removals = new Map<string, Promise<void>>();
  const listeners = new Set<() => void>();
  const pendingCounts = new Map<string, number>();
  let pending: ReadonlySet<string> = new Set();
  let tail: Promise<unknown> = Promise.resolve();

  const revision = (slug: string) => revisions.get(slug) ?? 0;
  const publish = (slug: string, change: number) => {
    const count = (pendingCounts.get(slug) ?? 0) + change;
    if (count) pendingCounts.set(slug, count);
    else pendingCounts.delete(slug);
    pending = new Set(pendingCounts.keys());

    for (const listener of listeners) listener();
  };
  const enqueue = <T>(action: () => Promise<T>) => {
    const promise = tail.then(action);
    tail = promise.catch(() => {});
    return promise;
  };
  const write = (slug: string, action: WriteAction, expectedRevision = revision(slug)): Promise<boolean | undefined> => {
    if (removals.has(slug) || expectedRevision !== revision(slug)) return Promise.resolve(undefined);

    const existing = writes.get(slug);

    if (existing?.revision === expectedRevision) return existing.promise;

    const isCurrent = () => revision(slug) === expectedRevision && !removals.has(slug);
    const promise = enqueue(async () => {
      if (!isCurrent()) return;

      const result = await action(isCurrent);
      return isCurrent() ? result : undefined;
    }).finally(() => {
      if (writes.get(slug)?.promise === promise) writes.delete(slug);
      publish(slug, -1);
    });
    writes.set(slug, {
      revision: expectedRevision,
      promise
    });
    publish(slug, 1);
    return promise;
  };
  const remove = (slug: string, action: () => Promise<void>): Promise<void> => {
    const existing = removals.get(slug);

    if (existing) return existing;

    revisions.set(slug, revision(slug) + 1);
    const promise = enqueue(action).finally(() => {
      removals.delete(slug);
      publish(slug, -1);
    });
    removals.set(slug, promise);
    publish(slug, 1);
    return promise;
  };

  return {
    revision,
    write,
    remove,
    getSnapshot: () => pending,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
};

export const presenceMutations = createPresenceMutations();