import { describe, expect, it } from "vitest"
import { commonPresenceLocales, presenceLocalesOf } from "@/lib/presence-locales"
import { PRESENCE_LOCALES } from "@/shared/locales"
import type { InstalledPresences, StoredPresence } from "@/shared/types"

const stored = (locales?: string[]): StoredPresence =>
  ({ metadata: { locales: locales ? Object.fromEntries(locales.map((code) => [code, {}])) : undefined } }) as StoredPresence

const ALL = [...PRESENCE_LOCALES]

describe("presenceLocalesOf", () => {
  it("keeps supported locales in display order and drops unknown ones", () => {
    expect(presenceLocalesOf({ "es-ES": {}, "xx-XX": {}, "en-US": {} })).toEqual(["en-US", "es-ES"])
  })
})

describe("commonPresenceLocales", () => {
  it("offers every locale when nothing is installed", () => {
    expect(commonPresenceLocales({})).toEqual(ALL)
  })

  it("keeps only the locales shared by every installed presence", () => {
    const presences: InstalledPresences = { nowly: stored(ALL), youtube: stored(["en-US", "fr-FR", "es-ES"]) }
    expect(commonPresenceLocales(presences)).toEqual(["en-US", "fr-FR", "es-ES"])
  })

  it("offers the full list when only fully translated presences are installed", () => {
    expect(commonPresenceLocales({ nowly: stored(ALL), "product-hunt": stored(ALL) })).toEqual(ALL)
  })

  it("ignores presences that ship no translations", () => {
    expect(commonPresenceLocales({ local: stored(), youtube: stored(["en-US", "fr-FR"]) })).toEqual(["en-US", "fr-FR"])
  })
})
