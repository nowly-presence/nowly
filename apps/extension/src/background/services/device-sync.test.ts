import { afterEach, expect, it, vi } from "vitest";
import { syncDeviceState } from "./device-sync";
import type { InstalledPresences, PresenceMetadata, StoredPresence } from "@/shared/types";

const local = vi.hoisted(
  (): {
    presences: InstalledPresences;
  } => ({
    presences: {}
  })
);

vi.mock("@/background/runtime-logs", () => ({ addRuntimeLog: vi.fn() }));
vi.mock("@/background/services/background-context", () => ({
  getCachedDeviceId: () => "device-id"
}));
vi.mock("@/background/services/api-state", () => ({
  getEffectiveApiUrl: () => "https://api.nowly.me"
}));
vi.mock("@/background/services/device-info", () => ({
  browserName: () => "Chrome",
  osName: () => "Windows"
}));
vi.mock("@/background/storage/device.store", () => ({}));
vi.mock("@/background/storage/presences.store", () => ({
  getPresences: async () => local.presences
}));
vi.mock("@/shared/locales", () => ({
  LOCALE_LONG_MAP: { en: "en-US" },
  loadLocale: async () => "en"
}));

afterEach(() => vi.unstubAllGlobals());

it("sends installed presence snapshots in order and ignores a removal superseded by a reinstall", async () => {
  const install = (version: string): StoredPresence => {
    const metadata: PresenceMetadata = {
      slug: "example",
      name: "Example",
      author: { name: "Example" },
      description: {},
      url: ["example.com"],
      color: "#000000",
      category: "other"
    };
    return {
      enabled: true,
      installedAt: 1,
      metadata,
      release: {
        slug: metadata.slug,
        version,
        metadata,
        bundle: "",
        sha256: "",
        metadataHash: "",
        signature: "",
        signedAt: ""
      }
    };
  };
  local.presences = { example: install("1.0.0") };

  let finishFirst = () => {};
  let markStarted = () => {};
  const started = new Promise<void>((resolve) => {
    markStarted = resolve;
  });
  const firstResponse = new Promise<Response>((resolve) => {
    finishFirst = () => resolve(new Response(null, { status: 503 }));
  });
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockImplementationOnce(() => {
      markStarted();
      return firstResponse;
    })
    .mockResolvedValue(new Response(null, { status: 503 }));
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("chrome", {
    runtime: {
      getManifest: () => ({ version: "2.6.0" })
    }
  });

  const first = syncDeviceState();
  await started;
  local.presences = {};
  const removed = syncDeviceState([
    {
      slug: "example",
      enabled: false,
      installed: false
    }
  ]);
  local.presences = { example: install("2.0.0") };
  const reinstalled = syncDeviceState();

  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(fetch).toHaveBeenCalledOnce();
  finishFirst();
  await Promise.all([first, removed, reinstalled]);

  const versions = fetch.mock.calls.map(([, options]) => {
    const request = JSON.parse(String(options?.body));
    return request.presences;
  });
  expect(versions).toEqual([
    [
      {
        slug: "example",
        version: "1.0.0",
        enabled: true,
        installed: true
      }
    ],
    [
      {
        slug: "example",
        version: "2.0.0",
        enabled: true,
        installed: true
      }
    ],
    [
      {
        slug: "example",
        version: "2.0.0",
        enabled: true,
        installed: true
      }
    ]
  ]);
});