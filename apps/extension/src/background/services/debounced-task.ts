export const createDebouncedTask = (run: () => void, delayMs: number): (() => void) => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return () => {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      timer = null;
      run();
    }, delayMs);
  };
};