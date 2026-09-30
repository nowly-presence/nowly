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
    expect(settings.appearance).toBe("system")
  })
})

describe("getSettings seasonal themes migration", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("turns seasonal themes on for users coming from 2.2.0 and keeps their theme", async () => {
    const chrome = installChromeMock()
    chrome.local.settings = { presenceDisplayMode: "category", appearance: "dark" }

    const { getSettings, setSettings } = await import("@/background/storage/settings.store")
    expect(await getSettings()).toMatchObject({ appearance: "dark", seasonalThemes: true })
    expect(chrome.local.settings).toMatchObject({ appearance: "dark", seasonalThemes: true })

    await setSettings({ seasonalThemes: false })
    expect((await getSettings()).seasonalThemes).toBe(false)
  })

  it("splits the 2.2.1 Seasonal appearance into System with seasonal themes on", async () => {
    const chrome = installChromeMock()
    chrome.local.settings = { presenceDisplayMode: "category", appearance: "seasonal", seasonalThemeMigrated: true }

    const { getSettings } = await import("@/background/storage/settings.store")
    const settings = await getSettings()
    expect(settings).toMatchObject({ appearance: "system", seasonalThemes: true })
    expect(settings).not.toHaveProperty("seasonalThemeMigrated")
    expect(chrome.local.settings).not.toHaveProperty("seasonalThemeMigrated")
  })

  it("keeps seasonal themes off for 2.2.1 users who had left Seasonal", async () => {
    const chrome = installChromeMock()
    chrome.local.settings = { presenceDisplayMode: "category", appearance: "light", seasonalThemeMigrated: true }

    const { getSettings } = await import("@/background/storage/settings.store")
    expect(await getSettings()).toMatchObject({ appearance: "light", seasonalThemes: false })
  })

  it("starts fresh installs on System with seasonal themes on", async () => {
    installChromeMock()
    const { getSettings } = await import("@/background/storage/settings.store")
    expect(await getSettings()).toMatchObject({ appearance: "system", seasonalThemes: true })
  })
})
