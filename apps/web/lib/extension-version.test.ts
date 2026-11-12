import { describe, expect, it } from "vitest";
import { isVersionAtLeast } from "./extension-version";

describe("isVersionAtLeast", () => {
  it("accepts the minimum and newer versions", () => {
    expect(isVersionAtLeast("2.6.0", "2.6.0")).toBe(true);
    expect(isVersionAtLeast("2.6.1", "2.6.0")).toBe(true);
    expect(isVersionAtLeast("2.10.0", "2.6.0")).toBe(true);
    expect(isVersionAtLeast("3.0.0", "2.6.0")).toBe(true);
  });
  it("rejects older, missing or malformed versions", () => {
    expect(isVersionAtLeast("2.5.9", "2.6.0")).toBe(false);
    expect(isVersionAtLeast("1.9.0", "2.6.0")).toBe(false);
    expect(isVersionAtLeast(undefined, "2.6.0")).toBe(false);
    expect(isVersionAtLeast("canary", "2.6.0")).toBe(false);
  });
});