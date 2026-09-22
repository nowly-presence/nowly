import { beforeEach, describe, expect, it } from "vitest"
import { clearTabPresences, setFocusedTabId, upsertTabPresence } from "@/background/services/background-context"
import { installChromeMock } from "@/test/chrome-mock"
import type { ExtensionSettings, PresenceSchedule, StoredPresence } from "@/shared/types"

const presence = (slug: string, updatedAt: number) => ({ slug, presence: { name: slug }, updatedAt })

const baseSettings: ExtensionSettings = {
  presenceDisplayMode: "category",
  showPlayer: true,
  scheduleEnabled: false,
  activitySelectionMode: "focused",
  activityPriorityOrder: [],
}

describe("pickBroadcastEntry", () => {
  beforeEach(async () => {
    installChromeMock()
    await clearTabPresences()
    setFocusedTabId(null)
  })

  it("returns null when no tab has an active presence", async () => {
    const { pickBroadcastEntry } = await import("@/background/managers/activity-manager")
    expect(await pickBroadcastEntry(baseSettings)).toBeNull()
  })

  it("focused mode broadcasts the focused tab's presence when one exists", async () => {
    const { pickBroadcastEntry } = await import("@/background/managers/activity-manager")
    await upsertTabPresence(1, presence("youtube", 1000))
    await upsertTabPresence(2, presence("twitch", 2000))
    setFocusedTabId(1)

    expect((await pickBroadcastEntry(baseSettings))?.slug).toBe("youtube")
  })

  it("focused mode falls back to the most recently updated tab when nothing is focused", async () => {
    const { pickBroadcastEntry } = await import("@/background/managers/activity-manager")
    await upsertTabPresence(1, presence("youtube", 1000))
    await upsertTabPresence(2, presence("twitch", 2000))
    setFocusedTabId(null)

    expect((await pickBroadcastEntry(baseSettings))?.slug).toBe("twitch")
  })

  it("priority mode picks the entry earliest in activityPriorityOrder", async () => {
    const { pickBroadcastEntry } = await import("@/background/managers/activity-manager")
    await upsertTabPresence(1, presence("youtube", 1000))
    await upsertTabPresence(2, presence("twitch", 2000))
    setFocusedTabId(2)

    const settings: ExtensionSettings = { ...baseSettings, activitySelectionMode: "priority", activityPriorityOrder: ["youtube", "twitch"] }
    expect((await pickBroadcastEntry(settings))?.slug).toBe("youtube")
  })

  it("priority mode puts slugs absent from the order last", async () => {
    const { pickBroadcastEntry } = await import("@/background/managers/activity-manager")
    await upsertTabPresence(1, presence("unranked", 1000))
    await upsertTabPresence(2, presence("ranked", 2000))

    const settings: ExtensionSettings = { ...baseSettings, activitySelectionMode: "priority", activityPriorityOrder: ["ranked"] }
    expect((await pickBroadcastEntry(settings))?.slug).toBe("ranked")
  })
})

describe("shouldHoldDiscord", () => {
  const storedPresence = (overrides: Partial<StoredPresence> = {}): StoredPresence => ({
    metadata: { slug: "p", name: "p", author: { name: "a" }, description: {}, url: [], color: "#000", category: "other" },
    release: { slug: "p", version: "1.0.0", metadata: {} as never, bundle: "", sha256: "", metadataHash: "", signature: "", signedAt: "" },
    enabled: true,
    installedAt: 0,
    ...overrides,
  })

  it("holds when presence is globally paused", async () => {
    const chrome = installChromeMock()
    chrome.local.settings = { ...baseSettings, presencePaused: true }
    const { shouldHoldDiscord } = await import("@/background/managers/activity-manager")
    expect(await shouldHoldDiscord(storedPresence())).toBe(true)
  })

  it("holds while the presence is snoozed", async () => {
    const chrome = installChromeMock()
    chrome.local.settings = baseSettings
    const { shouldHoldDiscord } = await import("@/background/managers/activity-manager")
    expect(await shouldHoldDiscord(storedPresence({ snoozeUntil: Date.now() + 60_000 }))).toBe(true)
  })

  it("does not hold once the snooze has expired", async () => {
    const chrome = installChromeMock()
    chrome.local.settings = baseSettings
    const { shouldHoldDiscord } = await import("@/background/managers/activity-manager")
    expect(await shouldHoldDiscord(storedPresence({ snoozeUntil: Date.now() - 1 }))).toBe(false)
  })

  it("holds outside the configured schedule days", async () => {
    const chrome = installChromeMock()
    chrome.local.settings = { ...baseSettings, scheduleEnabled: true }
    const { shouldHoldDiscord } = await import("@/background/managers/activity-manager")
    const otherDay = (new Date().getDay() + 1) % 7
    const schedule: PresenceSchedule = { days: [otherDay] }
    expect(await shouldHoldDiscord(storedPresence({ schedule }))).toBe(true)
  })

  it("does not hold when scheduling is disabled even with a schedule set", async () => {
    const chrome = installChromeMock()
    chrome.local.settings = { ...baseSettings, scheduleEnabled: false }
    const { shouldHoldDiscord } = await import("@/background/managers/activity-manager")
    const schedule: PresenceSchedule = { days: [] }
    expect(await shouldHoldDiscord(storedPresence({ schedule }))).toBe(false)
  })
})
