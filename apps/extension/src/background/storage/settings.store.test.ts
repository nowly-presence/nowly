import { beforeEach, describe, expect, it, vi } from "vitest"
import { installChromeMock } from "@/test/chrome-mock"

describe("getSettings migration", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("strips the dead separateActivePresence/theme/canaryTheme keys and persists the cleanup", async () => {
    const chrome = installChromeMock()
    chrome.local.settings = {
      presenceDisplayMode: "grid",
      separateActivePresence: true,
      theme: "donator",
      canaryTheme: true,
    }

    const { getSettings } = await import("@/background/storage/settings.store")
    const settings = await getSettings()

    expect(settings).not.toHaveProperty("separateActivePresence")
    expect(settings).not.toHaveProperty("theme")
    expect(settings).not.toHaveProperty("canaryTheme")
    expect(settings.presenceDisplayMode).toBe("grid")

    // The migration writes the cleaned object back so the legacy keys don't
    // reappear on the next read.
    const stored = chrome.local.settings as Record<string, unknown>
    expect(stored).not.toHaveProperty("separateActivePresence")
  })

  it("leaves settings without legacy keys untouched", async () => {
    const chrome = installChromeMock()
    chrome.local.settings = { presenceDisplayMode: "category" }

    const { getSettings } = await import("@/background/storage/settings.store")
    const settings = await getSettings()

    expect(settings.presenceDisplayMode).toBe("category")
    expect(settings.appearance).toBe("system")
  })
})
