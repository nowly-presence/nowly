import { beforeEach, describe, expect, it, vi } from "vitest";
import { bulkTogglePresences, installPresence, togglePresence, uninstallPresence } from "@/background/managers/presence-manager";
import { registerPresenceScript } from "@/background/runtime/presence-scripts";
import { verifyPresenceRelease } from "@/background/services/release-security";
import { trackProduct } from "@/background/telemetry";
import type { PresenceRelease, StoredPresence } from "@/shared/types";

const store = vi.hoisted(() => ({ presences: {} as Record<string, StoredPresence> }));

vi.mock("@/background/storage/presences.store", () => ({
  getPresences: vi.fn(async () => structuredClone(store.presences)),
  setPresences: vi.fn(async (value: Record<string, StoredPresence>) => {
    store.presences = structuredClone(value);
  }),
  getCurrentActivity: vi.fn(async () => null)
}));
vi.mock("@/background/runtime/presence-scripts", () => ({
  registerPresenceScript: vi.fn(),
  unregisterPresenceScript: vi.fn(async () => {})
}));
vi.mock("@/background/services/release-security", () => ({ verifyPresenceRelease: vi.fn() }));
vi.mock("@/background/telemetry", () => ({ trackProduct: vi.fn(async () => {}) }));
vi.mock("@/background/runtime-logs", () => ({ addRuntimeLog: vi.fn() }));
vi.mock("@/background/services/device-sync", () => ({
  syncDeviceState: vi.fn(async () => {}),
  getActiveDeviceId: vi.fn(async () => "functional-id")
}));
vi.mock("@/background/services/background-context", () => ({ hasActiveSlugs: vi.fn(async () => false) }));
vi.mock("@/background/managers/activity-manager", () => ({
  handleClearActivity: vi.fn(),
  removeActiveSlug: vi.fn(),
  removeActiveSlugs: vi.fn()
}));
vi.mock("@/background/managers/install-queue", () => ({
  getInstallQueue: vi.fn(async () => []),
  setInstallQueue: vi.fn(),
  syncInstallQueueAlarm: vi.fn(),
  enqueueInstall: vi.fn(),
  isRetriableInstallFailure: vi.fn()
}));

const release: PresenceRelease = {
  slug: "private-slug",
  version: "1.0.0",
  bundle: "private-code",
  sha256: "hash",
  metadataHash: "hash",
  signature: "signature",
  signedAt: "2026-10-25",
  metadata: {
    slug: "private-slug",
    name: "Private title",
    author: { name: "Author" },
    description: {},
    url: ["private.example"],
    color: "#000000",
    category: "music"
  }
};

const existing = (enabled = false): StoredPresence => ({
  release,
  metadata: release.metadata,
  enabled,
  installedAt: 1,
  source: "store"
});

beforeEach(() => {
  vi.clearAllMocks();
  store.presences = {};
  vi.mocked(verifyPresenceRelease).mockResolvedValue({ ok: true });
  vi.mocked(registerPresenceScript).mockResolvedValue({ ok: true });
  vi.stubGlobal("chrome", {
    runtime: { sendMessage: vi.fn(async () => {}) }
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("", { status: 200 }))
  );
});

describe("presence event truth", () => {
  it("only confirms installation after verification, registration and persistence; no duplicate success on an identical release", async () => {
    await installPresence(
      {
        slug: release.slug,
        release
      },
      "web"
    );
    expect(store.presences[release.slug]).toMatchObject({
      enabled: true,
      release
    });
    expect(trackProduct).toHaveBeenCalledExactlyOnceWith({
      name: "presence_installed",
      source: "web",
      data: { category: "music" }
    });
    await installPresence(
      {
        slug: release.slug,
        release
      },
      "web"
    );
    expect(trackProduct).toHaveBeenCalledTimes(1);
    await installPresence(
      {
        slug: release.slug,
        release: {
          ...release,
          version: "2.0.0"
        }
      },
      "system"
    );
    expect(trackProduct).toHaveBeenLastCalledWith({
      name: "presence_updated",
      source: "system",
      data: { category: "music" }
    });
    expect(JSON.stringify(vi.mocked(trackProduct).mock.calls)).not.toMatch(/private|signature|functional-id/);
  });

  it("does not announce successful installation on signature or registration failure", async () => {
    vi.mocked(verifyPresenceRelease).mockResolvedValueOnce({
      ok: false,
      error: "BAD_SIGNATURE"
    });
    await installPresence(
      {
        slug: release.slug,
        release
      },
      "web"
    );
    expect(registerPresenceScript).not.toHaveBeenCalled();
    vi.mocked(registerPresenceScript).mockResolvedValueOnce({
      ok: false,
      error: "BLOCKED"
    });
    await installPresence(
      {
        slug: release.slug,
        release
      },
      "web"
    );
    expect(store.presences).toEqual({});
    expect(vi.mocked(trackProduct).mock.calls.map(([event]) => event)).toEqual([
      {
        name: "presence_install_failed",
        source: "web",
        data: { stage: "verification" }
      },
      {
        name: "presence_install_failed",
        source: "web",
        data: { stage: "registration" }
      }
    ]);
  });

  it("does not persist enabled or emit success when registration fails, then permits a successful retry", async () => {
    store.presences[release.slug] = existing();
    vi.mocked(registerPresenceScript).mockResolvedValueOnce({
      ok: false,
      error: "BLOCKED"
    });
    expect(
      (
        await togglePresence({
          slug: release.slug,
          enabled: true
        })
      ).ok
    ).toBe(false);
    expect(store.presences[release.slug].enabled).toBe(false);
    expect(trackProduct).not.toHaveBeenCalled();
    await togglePresence({
      slug: release.slug,
      enabled: true
    });
    expect(store.presences[release.slug].enabled).toBe(true);
    expect(trackProduct).toHaveBeenCalledExactlyOnceWith({
      name: "presence_enabled",
      source: "extension",
      data: { category: "music" }
    });
  });

  it("bulk enabling preserves failed state and reports failure rather than manufacturing success", async () => {
    store.presences[release.slug] = existing();
    vi.mocked(registerPresenceScript).mockResolvedValueOnce({
      ok: false,
      error: "BLOCKED"
    });
    expect((await bulkTogglePresences([release.slug, release.slug], true)).ok).toBe(false);
    expect(store.presences[release.slug].enabled).toBe(false);
    expect(trackProduct).not.toHaveBeenCalled();
  });

  it("does not count removal of a presence that is not installed", async () => {
    await uninstallPresence({ slug: release.slug }, "web");
    expect(trackProduct).not.toHaveBeenCalled();
  });
});