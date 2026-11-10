import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import "@/shared/validation-runtime";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("extension validation runtime", () => {
  it("validates objects without invoking the Function constructor", () => {
    const generateCode = vi.fn(() => {
      throw new Error("Runtime code generation is forbidden");
    });
    vi.stubGlobal(
      "Function",
      new Proxy(Function, {
        apply: generateCode,
        construct: generateCode
      })
    );

    const schema = z.object({ enabled: z.boolean() });

    expect(schema.safeParse({ enabled: true }).success).toBe(true);
    expect(schema.safeParse({ enabled: "true" }).success).toBe(false);
    expect(generateCode).not.toHaveBeenCalled();
  });
});