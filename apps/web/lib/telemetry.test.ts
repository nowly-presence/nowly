import { afterEach, describe, expect, it, vi } from "vitest";
import { trackProduct } from "./telemetry";

describe("website telemetry", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("forwards website events to Umami only in production", () => {
    const track = vi.fn();
    vi.stubGlobal("window", { umami: { track } });
    vi.stubEnv("NODE_ENV", "development");
    trackProduct({ name: "extension_download_click", source: "web", data: { browser: "chrome" } });
    expect(track).not.toHaveBeenCalled();
    vi.stubEnv("NODE_ENV", "production");
    trackProduct({ name: "extension_download_click", source: "web", data: { browser: "chrome" } });
    expect(track).toHaveBeenCalledWith("extension_download_click", { browser: "chrome" });
  });
});
