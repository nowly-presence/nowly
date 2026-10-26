import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setSiteConsent, siteConsent, trackProduct } from "./telemetry";

vi.mock("@/lib/presence-api-client", () => ({
  presenceApiBaseUrl: () => "https://api.test"
}));

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

  it("fails closed if storage is unavailable and never sends from development", () => {
    vi.stubGlobal("localStorage", {
      removeItem: () => {
        throw new Error("blocked");
      }
    });
    expect(siteConsent()).toBeNull();
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    vi.stubEnv("NODE_ENV", "development");
    trackProduct({
      name: "site_visit",
      source: "web",
      data: { page: "home" }
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});