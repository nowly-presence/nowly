import { describe, expect, it } from "vitest"
import {
  hasMeaningfulLocalData,
  mergeSyncValue,
  mergeThreeWay,
  projectPresences,
  projectPresenceSettings,
  projectSettings,
  syncEqual,
} from "@/shared/account-sync"
import type { ExtensionSettings, InstalledPresences, StoredPresence } from "@/shared/types"

const stored = (overrides: Partial<StoredPresence>): StoredPresence => ({
  metadata: {
    slug: "youtube",
    name: "YouTube",
    author: { name: "Nowly" },
    description: { "en-US": "Video" },
    url: ["youtube.com"],
    color: "#ff0000",
    category: "video",
  },
  release: {
    slug: "youtube",
    version: "1.0.0",
    metadata: {
      slug: "youtube",
      name: "YouTube",
      author: { name: "Nowly" },
      description: { "en-US": "Video" },
      url: ["youtube.com"],
      color: "#ff0000",
      category: "video",
    },
    bundle: "",
    sha256: "",
    metadataHash: "",
    signature: "",
    signedAt: "",
  },
  enabled: true,
  installedAt: 1000,
  ...overrides,
})

describe("projectSettings", () => {
  it("never includes device-only settings", () => {
    const settings: ExtensionSettings = {
      presenceDisplayMode: "grid",
      showPlayer: false,
      appearance: "dark",
      developerMode: true,
      customApiBaseUrl: "http://localhost:3001",
      presencePaused: true,
    }
    expect(projectSettings(settings)).toEqual({ presenceDisplayMode: "grid", showPlayer: false, appearance: "dark" })
  })
})

describe("projectPresences", () => {
  it("lists store presences without bundles, activity or snooze, and skips local and bundled ones", () => {
    const presences: InstalledPresences = {
      youtube: stored({ snoozeUntil: 99, schedule: { days: [1, 2], start: "09:00", end: "17:00" } }),
      twitch: stored({ enabled: false, installedAt: 2000.4 }),
      local: stored({ source: "local" }),
      bundled: stored({ source: "bundle" }),
    }
    expect(projectPresences(presences)).toEqual([
      { slug: "twitch", enabled: false, installedAt: 2000 },
      { slug: "youtube", enabled: true, installedAt: 1000, schedule: { days: [1, 2], start: "09:00", end: "17:00" } },
    ])
  })

  it("keeps presences received from another device until they are installed here", () => {
    expect(projectPresences({}, { spotify: { slug: "spotify", enabled: true, installedAt: 5 } })).toEqual([
      { slug: "spotify", enabled: true, installedAt: 5 },
    ])
  })
})

describe("projectPresenceSettings", () => {
  it("drops values the server would reject and empty entries", () => {
    expect(projectPresenceSettings({ youtube: { lang: "fr", cover: true, list: ["a"] }, twitch: { nested: { a: 1 } } })).toEqual({
      youtube: { lang: "fr", cover: true },
    })
  })
})

describe("mergeThreeWay", () => {
  it("takes the remote change when nothing changed locally", () => {
    expect(mergeThreeWay({ appearance: "light" }, { appearance: "light" }, { appearance: "dark" })).toEqual({ appearance: "dark" })
  })

  it("keeps local changes and remote changes on different fields", () => {
    expect(
      mergeThreeWay({ appearance: "light", showPlayer: true }, { appearance: "dark", showPlayer: true }, { appearance: "light", showPlayer: false }),
    ).toEqual({ appearance: "dark", showPlayer: false })
  })

  it("lets the local write win on the same field", () => {
    expect(mergeThreeWay({ appearance: "light" }, { appearance: "dark" }, { appearance: "system" })).toEqual({ appearance: "dark" })
  })

  it("treats arrays as one value", () => {
    expect(mergeThreeWay(["a"], ["a", "b"], ["c"])).toEqual(["a", "b"])
  })
})

describe("mergeSyncValue", () => {
  it("merges presences by slug, with installs and uninstalls from both sides", () => {
    const base = [
      { slug: "youtube", enabled: true, installedAt: 1 },
      { slug: "twitch", enabled: true, installedAt: 2 },
    ]
    const local = [
      { slug: "youtube", enabled: false, installedAt: 1 },
      { slug: "twitch", enabled: true, installedAt: 2 },
      { slug: "spotify", enabled: true, installedAt: 3 },
    ]
    const remote = [
      { slug: "youtube", enabled: true, installedAt: 1 },
      { slug: "netflix", enabled: true, installedAt: 4 },
    ]
    expect(mergeSyncValue("presences", base, local, remote)).toEqual([
      { slug: "netflix", enabled: true, installedAt: 4 },
      { slug: "spotify", enabled: true, installedAt: 3 },
      { slug: "youtube", enabled: false, installedAt: 1 },
    ])
  })

  it("merges presence settings per presence and per field", () => {
    expect(
      mergeSyncValue(
        "presenceSettings",
        { youtube: { lang: "en", cover: true } },
        { youtube: { lang: "fr", cover: true } },
        { youtube: { lang: "en", cover: false }, twitch: { chat: true } },
      ),
    ).toEqual({ youtube: { lang: "fr", cover: false }, twitch: { chat: true } })
  })

  it("never forgets a feature reveal and keeps the first time it was seen", () => {
    expect(mergeSyncValue("featureReveals", {}, { "account-sync": 20, a: 1 }, { "account-sync": 10, b: 2 })).toEqual({ "account-sync": 10, a: 1, b: 2 })
  })

  it("applies the remote value as is on a first sync without local changes", () => {
    expect(mergeSyncValue("settings", undefined, undefined, { appearance: "dark" })).toEqual({ appearance: "dark" })
  })
})

describe("helpers", () => {
  it("compares values independently of key order", () => {
    expect(syncEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
    expect(syncEqual(undefined, null)).toBe(true)
  })

  it("only asks which data to keep when this device has presences or presence settings", () => {
    expect(hasMeaningfulLocalData({ presences: [], presenceSettings: {} })).toBe(false)
    expect(hasMeaningfulLocalData({ presences: [{ slug: "a", enabled: true, installedAt: 1 }], presenceSettings: {} })).toBe(true)
  })
})
