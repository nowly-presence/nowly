import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("SKIP_ENV_VALIDATION", "false");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("@nowly/env", () => {
  it("rejects server startup without the signing secret", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECRET", "");
    const report = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../src/server")).rejects.toThrow("Invalid environment variables");
    expect(report).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({
          path: ["JWT_SECRET"]
        })
      ])
    );
  });
});