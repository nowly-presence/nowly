import { describe, expect, it } from "vitest";
import { urlMatchesPattern, urlMatchesPresence } from "@/shared/url-patterns";

describe("url-patterns", () => {
  it("matches url patterns across wildcards, path prefixes, exact paths, and schemes", () => {
    // Wildcard host
    expect(urlMatchesPattern("https://music.example.com/", "*://*.example.com/*")).toBe(true);
    expect(urlMatchesPattern("https://example.com/", "*://*.example.com/*")).toBe(true);
    expect(urlMatchesPattern("https://other.com/", "*://*.example.com/*")).toBe(false);

    // Path prefix & exact path
    expect(urlMatchesPattern("https://example.com/watch/123", "https://example.com/watch/*")).toBe(true);
    expect(urlMatchesPattern("https://example.com/browse", "https://example.com/watch/*")).toBe(false);
    expect(urlMatchesPattern("https://example.com/exact", "https://example.com/exact")).toBe(true);
    expect(urlMatchesPattern("https://example.com/exact/", "https://example.com/exact")).toBe(false);

    // Schemes
    expect(urlMatchesPattern("http://example.com/", "https://example.com/*")).toBe(false);
    expect(urlMatchesPattern("http://example.com/", "*://example.com/*")).toBe(true);

    // Resilient error handling
    expect(urlMatchesPattern("not-a-url", "*://example.com/*")).toBe(false);
    expect(urlMatchesPattern("https://example.com/", "not-a-pattern")).toBe(false);
  });

  it("evaluates presence URL list matches", () => {
    expect(urlMatchesPresence("https://sub.example.com/page", ["example.com"])).toBe(true);
    expect(urlMatchesPresence("https://example.com/", [])).toBe(false);
    expect(urlMatchesPresence("https://example.com/", undefined)).toBe(false);
  });
});