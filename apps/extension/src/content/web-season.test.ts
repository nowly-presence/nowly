import { describe, expect, it } from "vitest"
import { readWebSeason, seasonalThemesEnabled, startWebSeason } from "@/content/web-season"

const NOWLY = "https://nowly.me"
const OCTOBER = new Date(2026, 9, 12, 12)
const JUNE = new Date(2026, 5, 20, 12)

type Posted = { message: unknown; targetOrigin: string }
type MessageListener = (event: { origin: string; source: unknown; data: unknown }) => void
type ChangeListener = (changes: Record<string, unknown>, area: string) => void

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const setup = ({ origin = NOWLY, local = {}, date = OCTOBER }: { origin?: string; local?: Record<string, unknown>; date?: Date } = {}) => {
  const posted: Posted[] = []
  const messageListeners: MessageListener[] = []
  const changeListeners: ChangeListener[] = []
  const target = {
    location: { origin },
    postMessage: (message: unknown, targetOrigin: string) => posted.push({ message, targetOrigin }),
    addEventListener: (_type: "message", listener: MessageListener) => messageListeners.push(listener),
  }
  const storage = {
    get: async (keys: string[]) => Object.fromEntries(keys.map((key) => [key, local[key]])),
    onChanged: { addListener: (listener: ChangeListener) => changeListeners.push(listener) },
  }
  startWebSeason({ target, storage, isAllowedOrigin: (value) => value === NOWLY, now: () => date })
  const change = async (values: Record<string, unknown>) => {
    Object.assign(local, values)
    changeListeners.forEach((listener) => listener(Object.fromEntries(Object.keys(values).map((key) => [key, { newValue: values[key] }])), "local"))
    await flush()
  }
  const request = async (from: { origin?: string; source?: unknown } = {}) => {
    messageListeners.forEach((listener) => listener({ origin: from.origin ?? NOWLY, source: "source" in from ? from.source : target, data: { source: "Nowly", type: "GET_SEASON" } }))
    await flush()
  }
  return { posted, change, request }
}

const seasonOf = (posted: Posted) => (posted.message as { payload: { season: unknown } }).payload.season

describe("seasonalThemesEnabled", () => {
  it("defaults to on and mirrors the settings migration", () => {
    expect(seasonalThemesEnabled(undefined)).toBe(true)
    expect(seasonalThemesEnabled({ seasonalThemes: false })).toBe(false)
    expect(seasonalThemesEnabled({ seasonalThemes: true })).toBe(true)
    expect(seasonalThemesEnabled({ appearance: "seasonal", seasonalThemeMigrated: true })).toBe(true)
    expect(seasonalThemesEnabled({ seasonalThemeMigrated: true })).toBe(false)
  })
})

describe("readWebSeason", () => {
  it("resolves the season with the setting and the override", async () => {
    const storage = (local: Record<string, unknown>) => ({ get: async () => local, onChanged: { addListener: () => undefined } })
    expect(await readWebSeason(storage({}), OCTOBER)).toBe("halloween")
    expect(await readWebSeason(storage({ settings: { seasonalThemes: false } }), OCTOBER)).toBeNull()
    expect(await readWebSeason(storage({ seasonOverride: "winter" }), OCTOBER)).toBe("winter")
    expect(await readWebSeason(storage({ seasonOverride: "none" }), OCTOBER)).toBeNull()
    expect(await readWebSeason(storage({ seasonOverride: "bogus" }), JUNE)).toBe("summer")
    expect(await readWebSeason(storage({}), new Date(2026, 6, 14, 12))).toBeNull()
  })
})

describe("startWebSeason", () => {
  it("sends the season on detection, to the page origin only", async () => {
    const { posted } = setup()
    await flush()
    expect(posted).toEqual([{ message: { source: "Nowly", type: "SEASON", payload: { season: "halloween" } }, targetOrigin: NOWLY }])
  })

  it("sends null when seasonal themes are off", async () => {
    const { posted } = setup({ local: { settings: { seasonalThemes: false } } })
    await flush()
    expect(posted.map(seasonOf)).toEqual([null])
  })

  it("sends again when the setting or the override changes, and only then", async () => {
    const { posted, change } = setup()
    await flush()
    await change({ settings: { seasonalThemes: false } })
    await change({ settings: { seasonalThemes: false, presenceLanguage: "fr-FR" } })
    await change({ seasonOverride: "winter", settings: { seasonalThemes: true } })
    expect(posted.map(seasonOf)).toEqual(["halloween", null, "winter"])
  })

  it("answers an explicit request from the page", async () => {
    const { posted, request } = setup()
    await flush()
    await request()
    expect(posted.map(seasonOf)).toEqual(["halloween", "halloween"])
  })

  it("ignores requests from another frame or origin", async () => {
    const { posted, request } = setup()
    await flush()
    await request({ source: null })
    await request({ origin: "https://evil.example" })
    expect(posted).toHaveLength(1)
  })

  it("stays silent outside nowly.me", async () => {
    const { posted, change, request } = setup({ origin: "https://example.com" })
    await flush()
    await change({ settings: { seasonalThemes: false } })
    await request({ origin: "https://example.com" })
    expect(posted).toEqual([])
  })
})
