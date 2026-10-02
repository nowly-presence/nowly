import { describe, expect, it, vi } from "vitest"

describe("registerContextMenu", () => {
  it("serializes concurrent registrations before creating stable menu ids", async () => {
    const removeAllCallbacks: Array<() => void> = []
    const create = vi.fn((
      _properties: chrome.contextMenus.CreateProperties,
      callback?: () => void,
    ) => callback?.())
    const chromeMock = {
      runtime: { lastError: undefined },
      i18n: { getMessage: vi.fn(() => "") },
      contextMenus: {
        removeAll: vi.fn((callback: () => void) => removeAllCallbacks.push(callback)),
        create,
        update: vi.fn(),
        onClicked: { addListener: vi.fn() },
      },
      storage: {
        local: { get: vi.fn(async () => ({})), set: vi.fn(async () => undefined) },
        session: { get: vi.fn(async () => ({})), set: vi.fn(async () => undefined) },
      },
    }
    vi.stubGlobal("chrome", chromeMock)

    // Load after stubbing Chrome because registration starts at module call time.
    const { registerContextMenu } = await import("@/background/services/context-menu")
    registerContextMenu()
    registerContextMenu()

    expect(chromeMock.contextMenus.removeAll).toHaveBeenCalledTimes(1)
    expect(create).not.toHaveBeenCalled()

    removeAllCallbacks[0]?.()
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(create).toHaveBeenCalledTimes(2)
    expect(create.mock.calls.map(([properties]) => properties.id)).toEqual([
      "nowly-page-presence",
      "nowly-mute-tab",
    ])
  })
})
