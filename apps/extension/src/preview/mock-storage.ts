import type { MockEvent } from "@/preview/mock-events"

export type StorageChanges = Record<string, { oldValue?: unknown; newValue?: unknown }>
export type StorageChangedEvent = MockEvent<[StorageChanges, string]>

export const createMockStorageArea = (name: "local" | "session", onChanged: StorageChangedEvent) => {
  const data = new Map<string, unknown>()

  const get = async (keys?: string | string[] | null): Promise<Record<string, unknown>> => {
    if (keys == null) return Object.fromEntries(data)
    const list = Array.isArray(keys) ? keys : [keys]
    return Object.fromEntries(list.filter((key) => data.has(key)).map((key) => [key, structuredClone(data.get(key))]))
  }

  const set = async (items: Record<string, unknown>): Promise<void> => {
    const changes: StorageChanges = {}
    for (const [key, value] of Object.entries(items)) {
      changes[key] = { oldValue: data.get(key), newValue: value }
      data.set(key, structuredClone(value))
    }
    onChanged.emit(changes, name)
  }

  const remove = async (keys: string | string[]): Promise<void> => {
    const changes: StorageChanges = {}
    for (const key of Array.isArray(keys) ? keys : [keys]) {
      changes[key] = { oldValue: data.get(key) }
      data.delete(key)
    }
    onChanged.emit(changes, name)
  }

  const read = async <T,>(key: string, fallback: T): Promise<T> => ((await get(key))[key] as T | undefined) ?? fallback

  return { get, set, remove, read }
}

export type MockStorageArea = ReturnType<typeof createMockStorageArea>
