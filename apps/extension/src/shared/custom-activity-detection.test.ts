import { describe, expect, it } from "vitest";
import { detectionHost, matchesDetectionUrl, parseDetectionUrl } from "@/shared/custom-activity-detection";

describe("parseDetectionUrl", () => {
  it("normalizes hosts, wildcards, ports and paths while dropping query/hash and trailing slashes", () => {
    expect(parseDetectionUrl("watchparty.netflix.com")).toEqual({ host: "watchparty.netflix.com", path: "" });
    expect(parseDetectionUrl("https://www.example.com/Movie/Room?invite=1#top")).toEqual({ host: "example.com", path: "/movie/room" });
    expect(parseDetectionUrl("*.netflix.com")).toEqual({ host: "*.netflix.com", path: "" });
    expect(parseDetectionUrl("http://localhost:3000/watch")).toEqual({ host: "localhost", path: "/watch" });
    expect(parseDetectionUrl("https://example.com/watch/")).toEqual({ host: "example.com", path: "/watch" });
    expect(parseDetectionUrl("https://example.com/watch/*")).toEqual({ host: "example.com", path: "/watch" });
  });

  it("rejects non-https schemes, credentials, bare non-dot hosts, and empty inputs", () => {
    expect(parseDetectionUrl("notahost")).toBeNull();
    expect(parseDetectionUrl("ftp://example.com")).toBeNull();
    expect(parseDetectionUrl("https://user:pass@example.com")).toBeNull();
    expect(parseDetectionUrl("   ")).toBeNull();
  });
});

describe("matchesDetectionUrl", () => {
  it("evaluates exact sites, wildcards, subpaths and unusable schemes accurately", () => {
    expect(matchesDetectionUrl("watchparty.netflix.com", "https://watchparty.netflix.com/room/42")).toBe(true);
    expect(matchesDetectionUrl("watchparty.netflix.com", "https://www.watchparty.netflix.com/")).toBe(true);
    expect(matchesDetectionUrl("watchparty.netflix.com", "https://netflix.com/room")).toBe(false);

    expect(matchesDetectionUrl("*.netflix.com", "https://watchparty.netflix.com/room")).toBe(true);
    expect(matchesDetectionUrl("*.netflix.com", "https://netflix.com/room")).toBe(true);

    expect(matchesDetectionUrl("example.com/watch", "https://example.com/watch/room")).toBe(true);
    expect(matchesDetectionUrl("example.com/watch", "https://example.com/watch")).toBe(true);
    expect(matchesDetectionUrl("example.com/watch", "https://example.com/watching")).toBe(false);
    expect(matchesDetectionUrl("example.com/watch", "https://example.com/other")).toBe(false);

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