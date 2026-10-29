import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import "@/shared/validation-runtime";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("extension validation runtime", () => {
  it("disables runtime code generation", () => {
    expect(z.core.globalConfig.jitless).toBe(true);
  });

  it("validates objects without invoking the Function constructor", () => {
    const constructor = vi.fn(() => {
      throw new Error("Runtime code generation is forbidden");
    });
    vi.stubGlobal("Function", constructor);

    const schema = z.object({ enabled: z.boolean() });

    expect(schema.safeParse({ enabled: true }).success).toBe(true);
    expect(schema.safeParse({ enabled: "true" }).success).toBe(false);
    expect(constructor).not.toHaveBeenCalled();
  });
});