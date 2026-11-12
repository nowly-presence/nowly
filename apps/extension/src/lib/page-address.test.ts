import { describe, expect, it } from "vitest";
import { isSiteTab, readPageAddress } from "@/lib/page-address";

describe("readPageAddress", () => {
  it("keeps a plain path untouched", () => {
    expect(readPageAddress("/watch", "senscritique.com")).toEqual({
      status: "plain",
      path: "/watch"
    });
    expect(readPageAddress("watch", "senscritique.com")).toEqual({
      status: "plain",
      path: "watch"
    });
  });

  it("strips the origin of a pasted url on the same site", () => {
    expect(readPageAddress("https://www.senscritique.com/live", "senscritique.com")).toEqual({
      status: "stripped",
      path: "/live"
    });
    expect(readPageAddress("senscritique.com/live", "senscritique.com")).toEqual({
      status: "stripped",
      path: "/live"
    });
    expect(readPageAddress("https://senscritique.com", "senscritique.com")).toEqual({
      status: "stripped",
      path: "/"
    });
  });

  it("flags a url on another site and keeps the text", () => {
    expect(readPageAddress("https://www.youtube.com/watch", "senscritique.com")).toEqual({
      status: "foreign",
      path: "https://www.youtube.com/watch"
    });
  });
});

describe("isSiteTab", () => {
  it("matches the domain and its subdomains", () => {
    expect(isSiteTab("https://www.senscritique.com/live", "senscritique.com")).toBe(true);
    expect(isSiteTab("https://example.com/", "senscritique.com")).toBe(false);
    expect(isSiteTab("not a url", "senscritique.com")).toBe(false);
  });
});