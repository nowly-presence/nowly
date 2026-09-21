// Minimal hand-rolled stand-in for the handful of chrome.* calls these unit
// tests touch - not a full chrome API mock, just enough to exercise pure
// logic that happens to read/write chrome.storage.local or getManifest().
export const installChromeMock = (overrides: { unpacked?: boolean } = {}): { local: Record<string, unknown> } => {
  const local: Record<string, unknown> = {}

  ;(globalThis as { chrome?: unknown }).chrome = {
    runtime: {
      getManifest: () => ({ version: "0.0.0-test", update_url: overrides.unpacked ? undefined : "https://example.com/update" }),
    },
    storage: {
      local: {
        get: async (key: string) => ({ [key]: local[key] }),
        set: async (values: Record<string, unknown>) => {
          Object.assign(local, values)
        },
      },
    },
  }

  return { local }
}
