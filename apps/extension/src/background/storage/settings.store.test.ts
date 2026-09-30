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

    const stored = chrome.local.settings as Record<string, unknown>
    expect(stored).not.toHaveProperty("separateActivePresence")
  })

  it("leaves settings without legacy keys untouched", async () => {
    const chrome = installChromeMock()
    chrome.local.settings = { presenceDisplayMode: "category" }

    const { getSettings } = await import("@/background/storage/settings.store")
    const settings = await getSettings()

    expect(settings.presenceDisplayMode).toBe("category")
    expect(settings.appearance).toBe("seasonal")
  })
})

describe("getSettings seasonal theme migration", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("moves users on the old System default to Seasonal once", async () => {
    const chrome = installChromeMock()
    chrome.local.settings = { presenceDisplayMode: "category", appearance: "system" }

    const { getSettings, setSettings } = await import("@/background/storage/settings.store")
    expect((await getSettings()).appearance).toBe("seasonal")
    expect(chrome.local.settings).toMatchObject({ appearance: "seasonal", seasonalThemeMigrated: true })

    await setSettings({ appearance: "system" })
    expect((await getSettings()).appearance).toBe("system")
  })

  it("keeps an explicit Light or Dark choice", async () => {
    const chrome = installChromeMock()
    chrome.local.settings = { presenceDisplayMode: "category", appearance: "dark" }

    const { getSettings } = await import("@/background/storage/settings.store")
    expect((await getSettings()).appearance).toBe("dark")
    expect(chrome.local.settings).toMatchObject({ appearance: "dark", seasonalThemeMigrated: true })
  })

  it("starts fresh installs on Seasonal", async () => {
    installChromeMock()
    const { getSettings } = await import("@/background/storage/settings.store")
    expect((await getSettings()).appearance).toBe("seasonal")
  })
})
