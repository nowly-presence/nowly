import { BUNDLED_PRESENCES } from "@/generated/bundled-presences";
import type { BundledPresence } from "@/generated/bundled-presences";
import type { PresenceRelease, StoredPresence } from "@/shared/types";
import { handleClearActivity, removeActiveSlug } from "@/background/managers/activity-manager";
import { addAnalyticsLog } from "@/background/analytics/analytics-log";
import { trackAnalytics } from "@/background/analytics/analytics-tracker";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { hasActiveSlugs } from "@/background/services/background-context";
import { getActiveDeviceId, syncDeviceState } from "@/background/services/device-sync";
import { registerPresenceScript, unregisterPresenceScript } from "@/background/runtime/presence-scripts";
import { verifyPresenceRelease } from "@/background/services/release-security";
import { getCurrentActivity, getPresences, setPresences } from "@/background/services/storage";

export const broadcastPresencesChanged = (): void => {
  chrome.runtime.sendMessage({ source: "PRESENCES_BACKGROUND", type: "PRESENCES_CHANGED" }).catch(() => {
    // No extension pages (popup/sidepanel) are open - that's fine.
  });
};

export const installPresence = async (payload: unknown): Promise<{ ok: boolean; error?: string }> => {
  const presence = payload as { slug: string; release: PresenceRelease };
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