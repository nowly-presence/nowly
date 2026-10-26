let pending: Promise<unknown> = Promise.resolve();

export const withCustomActivityWrite = <T>(write: () => Promise<T>): Promise<T> => {
  const next = pending.then(write, write);
  pending = next.catch(() => undefined);
  return next;
};