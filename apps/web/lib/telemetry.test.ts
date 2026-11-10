import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setSiteConsent, siteConsent, trackProduct } from "./telemetry";

describe("website consent", () => {
  const storage = new Map<string, string>();
  const dispatchEvent = vi.fn();

  beforeEach(() => {
    storage.clear();
    dispatchEvent.mockClear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key)
    });
    vi.stubGlobal("window", { dispatchEvent });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("does not treat the legacy dismissed banner as consent and removes its old analytics id", () => {
    storage.set("nowly_cookie_dismissed", "true");
    storage.set("nowly:analytics:v1:deviceId", "private");
    expect(siteConsent()).toBeNull();
    expect(storage.has("nowly:analytics:v1:deviceId")).toBe(false);
    setSiteConsent(true);
    expect(siteConsent()).toBe(true);
    setSiteConsent(false);
    expect(siteConsent()).toBe(false);
    expect(dispatchEvent).toHaveBeenCalledTimes(2);
  });

  it("fails closed if storage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      removeItem: () => {
        throw new Error("blocked");
      }
    });
    expect(siteConsent()).toBeNull();
  });

  it("forwards website events to Umami only in production", () => {
    const track = vi.fn();
    vi.stubGlobal("window", { dispatchEvent, umami: { track } });
    vi.stubEnv("NODE_ENV", "development");
    trackProduct({ name: "extension_download_click", source: "web", data: { browser: "chrome" } });
    expect(track).not.toHaveBeenCalled();
    vi.stubEnv("NODE_ENV", "production");
    trackProduct({ name: "extension_download_click", source: "web", data: { browser: "chrome" } });
    expect(track).toHaveBeenCalledWith("extension_download_click", { browser: "chrome" });
  });
});
