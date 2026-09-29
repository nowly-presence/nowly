import { describe, expect, it } from "vitest"
import type { ExtensionSettings, StoredPresence } from "@/shared/types"
import { connectionOf, isOutsideSchedule, presenceStatus } from "@/lib/presence-status"

const settings: ExtensionSettings = { presenceDisplayMode: "category", showPlayer: true }

const stored = (overrides: Partial<StoredPresence> = {}): StoredPresence => ({
  metadata: { slug: "youtube", name: "YouTube", author: { name: "a" }, description: {}, url: ["youtube.com"], color: "#f00", category: "video" },
  release: {
    slug: "youtube",
    version: "1.0.0",
    metadata: { slug: "youtube", name: "YouTube", author: { name: "a" }, description: {}, url: ["youtube.com"], color: "#f00", category: "video" },
    bundle: "",
    sha256: "",
    metadataHash: "",
    signature: "",
    signedAt: "",
  },
  enabled: true,
  installedAt: 0,
  ...overrides,
})

const context = { liveSlug: null, detectedSlugs: new Set<string>(), now: new Date(2026, 8, 28, 12, 0).getTime() }

describe("presenceStatus", () => {
  it("reports disabled before anything else", () => {
    expect(presenceStatus("youtube", stored({ enabled: false }), { ...settings, presencePaused: true }, context).kind).toBe("off")
  })

  it("reports an active snooze with its end time", () => {
    const until = context.now + 60_000
    expect(presenceStatus("youtube", stored({ snoozeUntil: until }), settings, context)).toEqual({ kind: "snoozed", until })
  })

  it("ignores schedules while the global switch is off", () => {
    const schedule = { days: [1], start: "09:00", end: "10:00" }
    expect(presenceStatus("youtube", stored({ schedule }), { ...settings, scheduleEnabled: false }, context).kind).toBe("ready")
    expect(presenceStatus("youtube", stored({ schedule }), { ...settings, scheduleEnabled: true }, context).kind).toBe("schedule")
  })

  it("distinguishes live and detected presences", () => {
    expect(presenceStatus("youtube", stored(), settings, { ...context, liveSlug: "youtube" }).kind).toBe("live")
    expect(presenceStatus("youtube", stored(), settings, { ...context, detectedSlugs: new Set(["youtube"]) }).kind).toBe("detected")
  })
})

describe("isOutsideSchedule", () => {
  it("checks days and hours", () => {
    const monday = new Date(2026, 8, 28, 12, 0)
    expect(isOutsideSchedule({ days: [1], start: "09:00", end: "18:00" }, monday)).toBe(false)
    expect(isOutsideSchedule({ days: [2], start: "09:00", end: "18:00" }, monday)).toBe(true)
    expect(isOutsideSchedule({ days: [1], start: "13:00", end: "18:00" }, monday)).toBe(true)
  })
})

describe("connectionOf", () => {
  it("maps native status to a connection state", () => {
    expect(connectionOf({ connected: true, discordConnected: true, status: "connected" })).toBe("discord")
    expect(connectionOf({ connected: true, status: "connected" })).toBe("no-discord")
    expect(connectionOf({ connected: false, status: "connecting" })).toBe("connecting")
    expect(connectionOf({ connected: false, status: "host not found" })).toBe("no-host")
  })
})
