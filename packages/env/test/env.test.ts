import { createEnv } from "@t3-oss/env-core";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { cliEnv } from "../src/cli";
import { clientEnv } from "../src/client";

describe("@nowly/env", () => {
  it("provides public config", () => {
    expect(clientEnv.NEXT_PUBLIC_API_BASE_URL).toMatch(/^https?:\/\//);
    expect(clientEnv.NEXT_PUBLIC_BASE_URL).toBe("http://localhost:3000");
    expect(clientEnv.NEXT_PUBLIC_ADSENSE_ENABLED).toBe(false);
    expect(cliEnv.API_URL).toBe("https://api.nowly.me");
  });

  it("throws clear errors for missing required server secrets", () => {
    expect(() =>
      createEnv({
        server: { JWT_SECRET: z.string().trim().min(1) },
        runtimeEnv: {},
        emptyStringAsUndefined: true
      })
    ).toThrow();
  });

  it("does not expose server secrets from client env", () => {
    expect("JWT_SECRET" in clientEnv).toBe(false);
  });
});