export const createSerialQueue = () => {
  let pending = Promise.resolve();

  return async <T>(operation: () => T | Promise<T>): Promise<T> => {
    const previous = pending;
    let release = () => {};
    pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;

    try {
      return await operation();
    } finally {
      release();
    }
  };
};