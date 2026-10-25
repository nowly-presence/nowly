import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  consent: false,
  storage: {} as Record<string, unknown>,
  send: vi.fn().mockResolvedValue(true)
}));

vi.mock("@nowly/telemetry", async (original) => ({
  ...(await original<typeof import("@nowly/telemetry")>()),
  sendEvent: mock.send
}));
vi.mock("@/background/services/api-state", () => ({
  getEffectiveApiUrl: () => "https://api.test"
}));
vi.mock("@/background/storage/device.store", () => ({
  getAnalyticsConsent: async () => mock.consent
}));
vi.mock("@/shared/brand", () => ({ IS_CANARY: false }));

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
  mock.consent = false;
  mock.storage = {};
  mock.send.mockReset().mockResolvedValue(true);
  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: async () => structuredClone(mock.storage),
        set: async (data: Record<string, unknown>) => {
          Object.assign(mock.storage, structuredClone(data));
        },
        remove: async (key: string) => {
          delete mock.storage[key];
        }
      }
    }
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const active = {
  name: "extension_active",
  source: "extension",
  data: {}
} as const;

const events = () => mock.send.mock.calls.map((call) => call[1]);

describe("local consented cohort accounting", () => {
  it("does not create state or events before opt-in", async () => {
    const { trackProduct } = await import("./telemetry");
    await trackProduct(active);
    expect(mock.send).not.toHaveBeenCalled();
    expect(mock.storage).toEqual({});
  });

  it("serializes duplicate panel events and persists deduplication across worker restarts", async () => {
    mock.consent = true;
    const { trackProduct } = await import("./telemetry");
    await Promise.all([
      trackProduct(active, { daily: "panel" }),
      trackProduct(active, { daily: "panel" })
    ]);
    vi.resetModules();
    await (await import("./telemetry")).trackProduct(active, { daily: "panel" });
    expect(events().map((event) => event.name)).toEqual(["extension_first_seen", "extension_active"]);
    expect(JSON.stringify(events())).not.toMatch(/deviceId|token|slug|version/);
  });

  it("counts each exact elapsed D1/D7/D30 window once, without catching up missed days", async () => {
    mock.consent = true;
    const { trackProduct } = await import("./telemetry");
    await trackProduct(active, { daily: "panel" });

    for (const day of [1, 7, 30]) {
      vi.setSystemTime(new Date(Date.parse("2026-10-01T12:00:00Z") + day * 86400000));
      await trackProduct(active, { daily: "panel" });
      await trackProduct(active, { daily: "panel" });
    }

    expect(
      events()
        .filter((event) => event.name === "retention_return")
        .map((event) => event.data)
    ).toEqual([
      {
        cohort_day: "2026-10-01",
        day: 1
      },
      {
        cohort_day: "2026-10-01",
        day: 7
      },
      {
        cohort_day: "2026-10-01",
        day: 30
      }
    ]);
  });

  it("does not establish a denominator on failed delivery and erases local state on withdrawal", async () => {
    mock.consent = true;
    const { trackProduct, clearProductTelemetry } = await import("./telemetry");
    mock.send.mockResolvedValueOnce(false);
    await trackProduct(active);
    expect(mock.storage).toEqual({});
    await trackProduct(active);
    mock.consent = false;
    await clearProductTelemetry();
    const count = mock.send.mock.calls.length;
    await trackProduct(active);
    expect(mock.storage).toEqual({});
    expect(mock.send).toHaveBeenCalledTimes(count);
  });

  it("deduplicates onboarding and coarse category use, never duration or watched content", async () => {
    mock.consent = true;
    const { trackProduct } = await import("./telemetry");

    const onboarding = {
      name: "onboarding_completed",
      source: "extension",
      data: {}
    } as const;
    const use = {
      name: "presence_used",
      source: "extension",
      data: {
        category: "video",
        origin: "store"
      }
    } as const;
    await trackProduct(onboarding, { once: "onboarding" });
    await trackProduct(onboarding, { once: "onboarding" });
    await trackProduct(use, { daily: "use:store:video" });
    await trackProduct(use, { daily: "use:store:video" });
    expect(events().map((event) => event.name)).toEqual(["extension_first_seen", "onboarding_completed", "presence_used"]);
  });
});