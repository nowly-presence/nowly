import { describe, expect, it } from "vitest";
import { detectionHost, matchesDetectionUrl, parseDetectionUrl } from "@/shared/custom-activity-detection";

describe("parseDetectionUrl", () => {
  it("accepts a bare host and adds the https scheme", () => {
    expect(parseDetectionUrl("watchparty.netflix.com")).toEqual({
      host: "watchparty.netflix.com",
      path: ""
    });
  });

  it("keeps the path and drops the query and hash", () => {
    expect(parseDetectionUrl("https://www.example.com/Movie/Room?invite=1#top")).toEqual({
      host: "example.com",
      path: "/movie/room"
    });
  });

  it("accepts a wildcard subdomain", () => {
    expect(parseDetectionUrl("*.netflix.com")).toEqual({
      host: "*.netflix.com",
      path: ""
    });
  });

  it("matches subdomains declared with a wildcard", () => {
    expect(matchesDetectionUrl("*.netflix.com", "https://watchparty.netflix.com/room")).toBe(true);
    expect(matchesDetectionUrl("*.netflix.com", "https://netflix.com/room")).toBe(true);
  });

  it("accepts localhost and rejects hosts without a dot", () => {
    expect(parseDetectionUrl("http://localhost:3000/watch")).toEqual({
      host: "localhost",
      path: "/watch"
    });
    expect(parseDetectionUrl("notahost")).toBeNull();
  });

  it("rejects non https protocols, credentials and empty values", () => {
    expect(parseDetectionUrl("ftp://example.com")).toBeNull();
    expect(parseDetectionUrl("https://user:pass@example.com")).toBeNull();
    expect(parseDetectionUrl("   ")).toBeNull();
  });

  it("normalizes a trailing slash and a trailing wildcard", () => {
    expect(parseDetectionUrl("https://example.com/watch/")).toEqual({
      host: "example.com",
      path: "/watch"
    });
    expect(parseDetectionUrl("https://example.com/watch/*")).toEqual({
      host: "example.com",
      path: "/watch"
    });
  });
});

describe("matchesDetectionUrl", () => {
  it("matches the whole site when no path is given", () => {
    expect(matchesDetectionUrl("watchparty.netflix.com", "https://watchparty.netflix.com/room/42")).toBe(true);
    expect(matchesDetectionUrl("watchparty.netflix.com", "https://www.watchparty.netflix.com/")).toBe(true);
    expect(matchesDetectionUrl("watchparty.netflix.com", "https://netflix.com/room")).toBe(false);
  });

  it("matches a wildcard declaration on the bare domain and its subdomains", () => {
    expect(matchesDetectionUrl("*.netflix.com", "https://watchparty.netflix.com/room")).toBe(true);
    expect(matchesDetectionUrl("*.netflix.com", "https://netflix.com/room")).toBe(true);
  });

  it("matches the path and everything below it", () => {
    expect(matchesDetectionUrl("example.com/watch", "https://example.com/watch/room")).toBe(true);
    expect(matchesDetectionUrl("example.com/watch", "https://example.com/watch")).toBe(true);
    expect(matchesDetectionUrl("example.com/watch", "https://example.com/watching")).toBe(false);
    expect(matchesDetectionUrl("example.com/watch", "https://example.com/other")).toBe(false);
  });

  it("ignores unusable page urls", () => {
    expect(matchesDetectionUrl("example.com", "chrome://extensions")).toBe(false);
    expect(matchesDetectionUrl("example.com", undefined)).toBe(false);
  });
});

describe("detectionHost", () => {
  it("strips the wildcard prefix for display", () => {
    expect(detectionHost("*.netflix.com")).toBe("netflix.com");
    expect(detectionHost("watchparty.netflix.com")).toBe("watchparty.netflix.com");
  });
});
