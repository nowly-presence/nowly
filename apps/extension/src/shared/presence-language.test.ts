import { describe, expect, it } from "vitest"
import { configuredPresenceLocale, defaultPresenceLocale } from "@/shared/presence-language"

const THREE = { "en-US": {}, "fr-FR": {}, "es-ES": {} }

describe("defaultPresenceLocale", () => {
  it("follows the interface language when the presence ships it", () => {
    expect(defaultPresenceLocale(THREE, "fr")).toBe("fr-FR")
  })

  it("falls back to en-US otherwise", () => {
    expect(defaultPresenceLocale(THREE, "de")).toBe("en-US")
    expect(defaultPresenceLocale(undefined, "fr")).toBe("en-US")
  })
})

describe("configuredPresenceLocale", () => {
  it("uses the global language when one is set", () => {
    expect(configuredPresenceLocale({ presenceLanguage: "es-ES" }, "youtube", THREE, "fr")).toBe("es-ES")
  })

  it("uses the saved per-presence choice before the default", () => {
    expect(configuredPresenceLocale({ presenceLanguage: "per-presence", presenceLanguages: { youtube: "en-US" } }, "youtube", THREE, "fr")).toBe("en-US")
  })

  it("defaults to the interface language per presence", () => {
    expect(configuredPresenceLocale({ presenceLanguage: "per-presence" }, "youtube", THREE, "fr")).toBe("fr-FR")
    expect(configuredPresenceLocale({}, "youtube", THREE, "fr")).toBe("fr-FR")
  })
})
