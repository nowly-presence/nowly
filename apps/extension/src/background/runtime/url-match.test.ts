import { describe, expect, it } from "vitest"
import { urlMatchesPattern, urlMatchesPresence } from "@/background/runtime/url-match"

describe("urlMatchesPattern", () => {
  it("matches a wildcard host suffix", () => {
    expect(urlMatchesPattern("https://music.example.com/", "*://*.example.com/*")).toBe(true)
    expect(urlMatchesPattern("https://example.com/", "*://*.example.com/*")).toBe(true)
    expect(urlMatchesPattern("https://other.com/", "*://*.example.com/*")).toBe(false)
  })

  it("matches a path prefix", () => {
    expect(urlMatchesPattern("https://example.com/watch/123", "https://example.com/watch/*")).toBe(true)
    expect(urlMatchesPattern("https://example.com/browse", "https://example.com/watch/*")).toBe(false)
  })

  it("matches an exact path when the pattern has no wildcard", () => {
    expect(urlMatchesPattern("https://example.com/exact", "https://example.com/exact")).toBe(true)
    expect(urlMatchesPattern("https://example.com/exact/", "https://example.com/exact")).toBe(false)
  })

  it("respects the scheme", () => {
    expect(urlMatchesPattern("http://example.com/", "https://example.com/*")).toBe(false)
    expect(urlMatchesPattern("http://example.com/", "*://example.com/*")).toBe(true)
  })

  it("rejects invalid URLs and patterns instead of throwing", () => {
    expect(urlMatchesPattern("not-a-url", "*://example.com/*")).toBe(false)
    expect(urlMatchesPattern("https://example.com/", "not-a-pattern")).toBe(false)
  })
})

describe("urlMatchesPresence", () => {
  it("matches when any configured presence URL matches", () => {
    expect(urlMatchesPresence("https://sub.example.com/page", ["example.com"])).toBe(true)
  })

  it("returns false for an empty or missing URL list", () => {
    expect(urlMatchesPresence("https://example.com/", [])).toBe(false)
    expect(urlMatchesPresence("https://example.com/", undefined)).toBe(false)
  })
})
