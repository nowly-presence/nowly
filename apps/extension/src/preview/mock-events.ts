export type MockEvent<Args extends unknown[]> = {
  addListener: (listener: (...args: Args) => unknown) => void
  removeListener: (listener: (...args: Args) => unknown) => void
  hasListener: (listener: (...args: Args) => unknown) => boolean
  emit: (...args: Args) => void
}

export const createMockEvent = <Args extends unknown[]>(): MockEvent<Args> => {
  const listeners = new Set<(...args: Args) => unknown>()
  return {
    addListener: (listener) => void listeners.add(listener),
    removeListener: (listener) => void listeners.delete(listener),
    hasListener: (listener) => listeners.has(listener),
    emit: (...args) => listeners.forEach((listener) => listener(...args)),
  }
}
