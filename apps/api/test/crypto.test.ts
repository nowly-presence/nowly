import { canonicalJson, sha256Base64Url, signedPayload } from "@/shared/crypto.service";
import { describe, expect, it, vi } from "vitest";

describe("crypto service", () => {
  describe("canonicalJson", () => {
    it("handles primitives, null, empty structures, and escaping", () => {
      expect(canonicalJson(null)).toBe("null");
      expect(canonicalJson("hello")).toBe('"hello"');
      expect(canonicalJson(42)).toBe("42");
      expect(canonicalJson(true)).toBe("true");
      expect(canonicalJson({})).toBe("{}");
      expect(canonicalJson([])).toBe("[]");
      expect(canonicalJson({ key: 'he"llo' })).toBe('{"key":"he\\"llo"}');
    });

    it("sorts object keys recursively and strips undefined fields", () => {
      const complex = {
        c: 3,
        a: 1,
        b: {
          y: 2,
          x: 1,
          ignored: undefined
        },
        items: ["b", "a"],
        missing: undefined
      };
      expect(canonicalJson(complex)).toBe('{"a":1,"b":{"x":1,"y":2},"c":3,"items":["b","a"]}');
    });
  });

  describe("sha256Base64Url", () => {
    it("generates deterministic and unique url-safe hashes", () => {
      const hash1 = sha256Base64Url("hello");
      const hash2 = sha256Base64Url("hello");
      const hashDifferent = sha256Base64Url("world");

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hashDifferent);
      expect(hash1).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe("signedPayload & signing safety", () => {
    it("produces deterministically sorted canonical JSON for presence release payloads", () => {
      const input = {
        slug: "youtube",
        version: "1.0.0",
        sha256: "abc123",
        metadataHash: "def456",
        signedAt: "2026-01-01T00:00:00Z"
      };

      const payload = signedPayload(input);
      expect(payload).toBe('{"metadataHash":"def456","sha256":"abc123","signedAt":"2026-01-01T00:00:00Z","slug":"youtube","version":"1.0.0"}');
      expect(JSON.parse(payload)).toEqual(input);
    });

    it("throws when PRESENCE_SIGNING_PRIVATE_KEY is missing", async () => {
      vi.stubEnv("PRESENCE_SIGNING_PRIVATE_KEY", "");
      vi.resetModules();
      const { signPresenceRelease } = await import("@/shared/crypto.service");

      expect(() => signPresenceRelease("{}")).toThrow("PRESENCE_SIGNING_PRIVATE_KEY is missing");
      vi.unstubAllEnvs();
    });
  });
});