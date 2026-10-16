import {
  canonicalJson,
  sha256Base64Url,
  signedPayload,
} from "@/shared/crypto.service";
import { describe, expect, it, vi } from "vitest";

describe("canonicalJson", () => {
  it("serializes null and primitives", () => {
    expect(canonicalJson(null)).toBe("null");
    expect(canonicalJson("hello")).toBe('"hello"');
    expect(canonicalJson(42)).toBe("42");
    expect(canonicalJson(true)).toBe("true");
  });

  it("sorts object keys alphabetically", () => {
    const result = canonicalJson({ c: 3, a: 1, b: 2 });
    expect(result).toBe('{"a":1,"b":2,"c":3}');
  });

  it("skips undefined values", () => {
    const result = canonicalJson({ a: 1, b: undefined });
    expect(result).toBe('{"a":1}');
  });

  it("handles nested objects", () => {
    const result = canonicalJson({ b: { y: 2, x: 1 }, a: 3 });
    expect(result).toBe('{"a":3,"b":{"x":1,"y":2}}');
  });

  it("serializes arrays", () => {
    const result = canonicalJson({ items: ["b", "a"] });
    expect(result).toBe('{"items":["b","a"]}');
  });

  it("handles empty object", () => {
    expect(canonicalJson({})).toBe("{}");
  });

  it("handles empty array", () => {
    expect(canonicalJson([])).toBe("[]");
  });

  it("escapes string values", () => {
    const result = canonicalJson({ key: 'he"llo' });
    expect(result).toBe('{"key":"he\\"llo"}');
  });
});

describe("sha256Base64Url", () => {
  it("produces expected hash for known input", () => {
    const hash = sha256Base64Url("hello");
    expect(hash).toBeTypeOf("string");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("is deterministic", () => {
    expect(sha256Base64Url("test")).toBe(sha256Base64Url("test"));
  });

  it("produces different output for different inputs", () => {
    expect(sha256Base64Url("foo")).not.toBe(sha256Base64Url("bar"));
  });
});

describe("signedPayload", () => {
  it("produces canonical JSON from input", () => {
    const input = {
      slug: "youtube",
      version: "1.0.0",
      sha256: "abc123",
      metadataHash: "def456",
      signedAt: "2026-01-01T00:00:00Z",
    };

    const payload = signedPayload(input);
    const parsed = JSON.parse(payload);

    expect(parsed.slug).toBe("youtube");
    expect(parsed.version).toBe("1.0.0");
    expect(parsed.sha256).toBe("abc123");
    expect(parsed.metadataHash).toBe("def456");
    expect(parsed.signedAt).toBe("2026-01-01T00:00:00Z");
  });

  it("sorts keys in output", () => {
    const input = {
      slug: "twitch",
      version: "2.0.0",
      sha256: "x",
      metadataHash: "y",
      signedAt: "2026-06-01T00:00:00Z",
    };
    const payload = signedPayload(input);
    expect(payload).toMatch(/^{"metadataHash":/);
  });
});

describe("signPresenceRelease", () => {
  it("throws when PRESENCE_SIGNING_PRIVATE_KEY is missing", async () => {
    vi.stubEnv("PRESENCE_SIGNING_PRIVATE_KEY", "");
    vi.resetModules();
    const { signPresenceRelease } = await import("@/shared/crypto.service");

    expect(() => signPresenceRelease("{}")).toThrow(
      "PRESENCE_SIGNING_PRIVATE_KEY is missing",
    );
    vi.unstubAllEnvs();
  });
});