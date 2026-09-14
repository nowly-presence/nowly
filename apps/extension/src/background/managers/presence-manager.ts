import { BUNDLED_PRESENCES } from "@/generated/bundled-presences";
import type { BundledPresence } from "@/generated/bundled-presences";
import type { PresenceCatalogItem, PresenceRelease, StoredPresence } from "@/shared/types";
import { handleClearActivity, removeActiveSlug } from "@/background/managers/activity-manager";
import { addAnalyticsLog } from "@/background/analytics/analytics-log";
import { trackAnalytics } from "@/background/analytics/analytics-tracker";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { hasActiveSlugs } from "@/background/services/background-context";
import { getActiveDeviceId, syncDeviceState } from "@/background/services/device-sync";
import { registerPresenceScript, unregisterPresenceScript } from "@/background/runtime/presence-scripts";
import { verifyPresenceRelease } from "@/background/services/release-security";
import { enqueueInstall, getInstallQueue, isRetriableInstallFailure, setInstallQueue, syncInstallQueueAlarm, type InstallQueueItem } from "@/background/managers/install-queue";
import { parsePresenceZip, toLocalRelease } from "@/background/managers/local-presence-zip";
import { getCurrentActivity, getPresences, setPresences } from "@/background/services/storage";

export const broadcastPresencesChanged = (): void => {
  chrome.runtime.sendMessage({ source: "PRESENCES_BACKGROUND", type: "PRESENCES_CHANGED" }).catch(() => {
    // No extension pages (popup/sidepanel) are open - that's fine.
  });
};

export const installPresence = async (payload: unknown): Promise<{ ok: boolean; error?: string }> => {
  const presence = payload as { slug: string; release: PresenceRelease; source?: StoredPresence["source"] };
  const verified = await verifyPresenceRelease(presence.release, presence.slug);
  if (!verified.ok) {
    addAnalyticsLog("error", "presence", "presence install verification failed", {
      slug: presence.slug,
      version: presence.release?.version,
      error: verified.error,
    });
    return verified;
  }

  const presences = await getPresences();
  const existing = presences[presence.slug];
  const nextPresence: StoredPresence = {
    metadata: presence.release.metadata,
    release: presence.release,
    enabled: existing?.enabled ?? true,
    installedAt: existing?.installedAt ?? Date.now(),
    updatedAt: Date.now(),
    source: presence.source ?? existing?.source ?? "store",
  };

  const registerResult = await registerPresenceScript(presence.slug, nextPresence);
  if (!registerResult.ok) {
    addAnalyticsLog("error", "presence", "presence install failed", {
      slug: presence.slug,
      version: presence.release.version,
      error: registerResult.error,
    });
    return registerResult;
  }

  presences[presence.slug] = nextPresence;
  await setPresences(presences);
  await syncDeviceState();
  addAnalyticsLog("success", "presence", existing ? "presence update installed" : "presence installed", {
    slug: presence.slug,
    version: presence.release.version,
  });
  void trackAnalytics(existing ? "presence_update" : "presence_install", {
    slug: presence.slug,
    version: presence.release.version,
    payload: { source: "extension" },
  });
  const queued = await getInstallQueue();
  const remaining = queued.filter((item) => item.slug !== presence.slug);
  if (remaining.length !== queued.length) {
    await setInstallQueue(remaining);
    await syncInstallQueueAlarm(remaining);
  }
  broadcastPresencesChanged();
  return { ok: true };
};

const deleteActivePresence = async (deviceId: string, slug: string): Promise<void> => {
  try {
    const response = await fetch(`${getEffectiveApiUrl()}/presences/active/${encodeURIComponent(deviceId)}/${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
    addAnalyticsLog(response.ok ? "success" : "warn", "api", "DELETE /presences/active/:deviceId/:slug result", { status: response.status, slug });
  } catch (error) {
    addAnalyticsLog("error", "api", "DELETE /presences/active/:deviceId/:slug failed", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const fetchPresenceCatalog = async (): Promise<PresenceCatalogItem[]> => {
  const response = await fetch(`${getEffectiveApiUrl()}/presences`, { cache: "no-store" });
  if (!response.ok) throw new Error(`catalog request failed: ${response.status}`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("invalid catalog");
  return data.filter((item): item is PresenceCatalogItem => {
    if (!item || typeof item !== "object") return false;
    const slug = (item as PresenceCatalogItem).slug;
    return typeof slug === "string" && slug.length > 0;
  });
};

export type InstallFromApiResult = {
  error?: string;
  ok: boolean;
  queued?: boolean;
  status?: number;
};

export const installPresenceFromApi = async (
  payload: unknown,
  options: { skipQueue?: boolean } = {},
): Promise<InstallFromApiResult> => {
  const slug = typeof payload === "object" && payload !== null
    ? (payload as { slug?: unknown }).slug
    : undefined;
  if (typeof slug !== "string" || slug.length === 0) {
    return { ok: false, error: "missing slug" };
  }

  const queueIfNeeded = async (status?: number, error?: string): Promise<InstallFromApiResult> => {
    if (options.skipQueue || !isRetriableInstallFailure(status)) {
      return { ok: false, error, status };
    }
    await enqueueInstall(slug);
    return { ok: false, queued: true, error, status };
  };

  try {
    const response = await fetch(`${getEffectiveApiUrl()}/presences/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      addAnalyticsLog("error", "api", "GET /presences/:slug failed", { slug, status: response.status });
      return queueIfNeeded(response.status, `release request failed: ${response.status}`);
    }
    const release = await response.json() as PresenceRelease;
    return installPresence({ slug, release });
  } catch (error) {
    const message = error instanceof Error ? error.message : "presence install failed";
    addAnalyticsLog("error", "api", "GET /presences/:slug failed", { slug, error: message });
    return queueIfNeeded(undefined, message);
  }
};

export const drainInstallQueue = async (): Promise<{ slugs: string[] }> => {
  const pending = await getInstallQueue();
  if (pending.length === 0) {
    await syncInstallQueueAlarm([]);
    return { slugs: [] };
  }

  const remaining: InstallQueueItem[] = [];
  for (const item of pending) {
    const result = await installPresenceFromApi({ slug: item.slug }, { skipQueue: true });
    if (result.ok) continue;
    if (isRetriableInstallFailure(result.status)) {
      remaining.push(item);
    }
  }

  await setInstallQueue(remaining);
  await syncInstallQueueAlarm(remaining);
  return { slugs: remaining.map((item) => item.slug) };
};

export const uninstallPresence = async (payload: unknown): Promise<{ ok: boolean }> => {
  const presences = await getPresences();
  const { slug } = payload as { slug: string };
  const deviceId = await getActiveDeviceId();
  const removedPresence = presences[slug];
  delete presences[slug];

  await setPresences(presences);
  await syncDeviceState([{
    slug,
    version: removedPresence?.release?.version ?? removedPresence?.metadata?.version ?? undefined,
    enabled: false,
    installed: false,
  }]);
  addAnalyticsLog("success", "presence", "presence uninstalled", {
    slug,
    version: removedPresence?.release?.version ?? removedPresence?.metadata?.version,
  });
  void trackAnalytics("presence_uninstall", { slug, payload: { source: "extension" } });
  broadcastPresencesChanged();
  await unregisterPresenceScript(slug);
  await removeActiveSlug(slug, "uninstall");
  await deleteActivePresence(deviceId, slug);
  if (!hasActiveSlugs()) {
    await handleClearActivity();
  }
  return { ok: true };
};

export const togglePresence = async (payload: unknown): Promise<{ ok: boolean; error?: string }> => {
  const presences = await getPresences();
  const { slug, enabled } = payload as { slug: string; enabled: boolean };
  const deviceId = await getActiveDeviceId();

  if (!presences[slug]) {
    return { ok: false };
  }

  presences[slug].enabled = enabled;
  await setPresences(presences);
  await syncDeviceState();
  void trackAnalytics("presence_toggle", { slug, payload: { enabled } });
  broadcastPresencesChanged();
  if (enabled) {
    const result = await registerPresenceScript(slug, presences[slug]);
    addAnalyticsLog(result.ok ? "success" : "error", "presence", "presence enabled", { slug, error: result.error });
    return result;
  }

  await unregisterPresenceScript(slug);
  await removeActiveSlug(slug, "disabled");
  const current = await getCurrentActivity();
  if (current?.slug === slug || !hasActiveSlugs()) {
    await handleClearActivity(slug);
  }
  addAnalyticsLog("info", "presence", "presence disabled", { slug });
  await deleteActivePresence(deviceId, slug);
  return { ok: true };
};

export const checkUpdates = async (): Promise<Record<string, string>> => {
  const presences = await getPresences();
  const updates: Record<string, string> = {};
  const slugs = Object.keys(presences);
  const results = await Promise.allSettled(
    slugs.map((slug) =>
      fetch(`${getEffectiveApiUrl()}/presences/${slug}`)
        .then((r) => r.json() as Promise<{ version: string }>)
        .then((data) => ({ slug, latestVersion: data.version }))
    )
  );
  for (const result of results) {
    if (result.status === "fulfilled") {
      const { slug, latestVersion } = result.value;
      const installed = presences[slug].release?.version;
      if (installed && latestVersion !== installed) {
        updates[slug] = latestVersion;
      }
    }
  }
  return updates;
};

const isUnpackedBuild = (): boolean => !chrome.runtime.getManifest().update_url;

const installDevPresences = async (presences: Record<string, StoredPresence>): Promise<string[]> => {
  if (!isUnpackedBuild()) return []

  try {
    const res = await fetch(chrome.runtime.getURL("dev-presences.json"))
    if (!res.ok) return []

    const devPresences: BundledPresence[] = await res.json()
    if (devPresences.length === 0) return []

    const slugs: string[] = []

    for (const dp of devPresences) {
      const existing = presences[dp.slug]
      if (existing?.release?.version && existing?.release?.version === dp.release.version) continue

      presences[dp.slug] = {
        metadata: dp.release.metadata,
        release: dp.release,
        enabled: true,
        installedAt: existing?.installedAt ?? Date.now(),
        updatedAt: Date.now(),
      }
      slugs.push(dp.slug)
    }

    return slugs
  } catch {
    return []
  }
}

export const installLocalPresenceZip = async (payload: unknown): Promise<{ ok: boolean; error?: string; slug?: string }> => {
  if (chrome.runtime.getManifest().update_url) {
    return { ok: false, error: "UNPACKED_BUILD_ONLY" };
  }

  const fileName = typeof payload === "object" && payload !== null && typeof (payload as { fileName?: unknown }).fileName === "string"
    ? (payload as { fileName: string }).fileName
    : "presence.zip";
  const bytes = typeof payload === "object" && payload !== null
    ? (payload as { bytes?: unknown }).bytes
    : payload;

  const parsed = await parsePresenceZip(bytes, fileName);
  if (!parsed.ok) return parsed;

  const release = await toLocalRelease(parsed.slug, parsed.metadata, parsed.bundle);
  const installed = await installPresence({ slug: parsed.slug, release, source: "local" });
  if (!installed.ok) return installed;
  return { ok: true, slug: parsed.slug };
};

export const installBundledPresences = async (): Promise<void> => {
  if (!BUNDLED_PRESENCES?.length && !isUnpackedBuild()) return;
  const presences = await getPresences();
  const bundledSlugs = new Set(BUNDLED_PRESENCES.map((bp) => bp.slug));
  let changed = false;

  const devSlugs = await installDevPresences(presences);
  if (devSlugs.length > 0) {
    for (const slug of devSlugs) bundledSlugs.add(slug);
    for (const dp of BUNDLED_PRESENCES) bundledSlugs.add(dp.slug);
    changed = true;
  }

  if (isUnpackedBuild()) {
    for (const slug of Object.keys(presences)) {
      if (bundledSlugs.has(slug)) continue;
      if (presences[slug].source === "local") continue;
      delete presences[slug];
      await unregisterPresenceScript(slug);
      await removeActiveSlug(slug, "dev-bundle-prune");
      changed = true;
    }
  }

  for (const bp of BUNDLED_PRESENCES) {
    const existing = presences[bp.slug];
    if (existing?.release?.version && existing?.release?.version === bp.release.version) continue;

    presences[bp.slug] = {
      metadata: bp.release.metadata,
      release: bp.release,
      enabled: true,
      installedAt: existing?.installedAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    changed = true;
  }

  if (changed) {
    await setPresences(presences);
    await syncDeviceState();
    broadcastPresencesChanged();
  }
};