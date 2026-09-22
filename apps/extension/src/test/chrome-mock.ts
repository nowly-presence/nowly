// Minimal hand-rolled stand-in for the handful of chrome.* calls these unit
// tests touch - not a full chrome API mock, just enough to exercise pure
// logic that happens to read/write chrome.storage.local or getManifest().
export const installChromeMock = (): { local: Record<string, unknown>; session: Record<string, unknown> } => {
  const local: Record<string, unknown> = {}
  const session: Record<string, unknown> = {}

  ;(globalThis as { chrome?: unknown }).chrome = {
    runtime: {
      getManifest: () => ({ version: "0.0.0-test" }),
    },
    storage: {
      local: {
        get: async (key: string) => ({ [key]: local[key] }),
        set: async (values: Record<string, unknown>) => {
          Object.assign(local, values)
        },
      },
      session: {
        get: async (key: string) => ({ [key]: session[key] }),
        set: async (values: Record<string, unknown>) => {
          Object.assign(session, values)
        },
      },
    },
  }

  return { local, session }
}
