import { categoryOf, type ProductEvent } from "@nowly/telemetry";
import { handleClearActivity, removeActiveSlug, removeActiveSlugs } from "@/background/managers/activity-manager";
import { drainQueuedInstalls, enqueueInstall, isRetriableInstallFailure, removeQueuedInstall } from "@/background/managers/install-queue";
import { parsePresenceZip, toLocalRelease } from "@/background/managers/local-presence-zip";
import { trackProduct } from "@/background/telemetry";
import { addRuntimeLog } from "@/background/runtime-logs";
import { registerPresenceScript, unregisterPresenceScript } from "@/background/runtime/presence-scripts";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { hasActiveSlugs } from "@/background/services/background-context";
import { getActiveDeviceId, syncDeviceState } from "@/background/services/device-sync";
import { verifyPresenceRelease } from "@/background/services/release-security";
import { getDeviceToken } from "@/background/storage/device.store";
import { getCurrentActivity, getPresences, mutatePresences } from "@/background/storage/presences.store";
import { BUNDLED_PRESENCES } from "@/generated/bundled-presences";
import type { BundledPresence } from "@/generated/bundled-presences";
import { IS_CANARY } from "@/shared/brand";
import { normalizeCatalog } from "@/shared/presence-catalog";
import type { InstalledPresences, PresenceCatalogItem, PresenceRelease, StoredPresence } from "@/shared/types";

const broadcastPresencesChanged = (): void => {
  chrome.runtime
    .sendMessage({
      source: "PRESENCES_BACKGROUND",
      type: "PRESENCES_CHANGED"
    })
    .catch(() => {});
};

type PresenceInstall = {
  slug: string;
  release: PresenceRelease;
  source?: StoredPresence["source"];
};

const installRelease = async (presence: PresenceInstall, source: ProductEvent["source"]): Promise<{
  ok: boolean;
  error?: string;
}> => {
  const verified = await verifyPresenceRelease(presence.release, presence.slug);

  if (!verified.ok) {
    void trackProduct({
      name: "presence_install_failed",
      source,
      data: { stage: "verification" }
    });
    addRuntimeLog("error", "presence", "presence install verification failed", {
      slug: presence.slug,
      version: presence.release?.version,
      error: verified.error
    });
    return verified;
  }

  const installed = await mutatePresences(async (presences) => {
    const existing = presences[presence.slug];
    const nextPresence: StoredPresence = {
      metadata: presence.release.metadata,
      release: presence.release,
      enabled: existing?.enabled ?? true,
      installedAt: existing?.installedAt ?? Date.now(),
      updatedAt: Date.now(),
      source: presence.source ?? existing?.source ?? "store"
    };
    const registerResult = await registerPresenceScript(presence.slug, nextPresence);
    if (registerResult.ok) presences[presence.slug] = nextPresence;
    return {
      changed: registerResult.ok,
      value: { existing, registerResult }
    };
  });

  const { existing, registerResult } = installed;

  if (!registerResult.ok) {
    void trackProduct({
      name: "presence_install_failed",
      source,
      data: { stage: "registration" }
    });
    addRuntimeLog("error", "presence", "presence install failed", {
      slug: presence.slug,
      version: presence.release.version,
      error: registerResult.error
    });
    return registerResult;
  }

  await syncDeviceState();
  addRuntimeLog("success", "presence", existing ? "presence update installed" : "presence installed", {
    slug: presence.slug,
    version: presence.release.version
  });
  if (!existing || existing.release?.version !== presence.release.version) void trackProduct({
    name: existing ? "presence_updated" : "presence_installed",
    source,
    data: { category: categoryOf(presence.release.metadata.category) }
  });
  return {
    ok: true
  };
};

export const installPresence = async (payload: unknown, source: ProductEvent["source"] = "system"): Promise<{
  ok: boolean;
  error?: string;
}> => {
  const presence = payload as PresenceInstall;
  const result = await installRelease(presence, source);

  if (result.ok) {
    await removeQueuedInstall(presence.slug);
    broadcastPresencesChanged();
  }

  return result;
};

const DELETE_RETRY_DELAY_MS = 2000;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const attemptDeleteActivePresence = async (deviceId: string, slug: string): Promise<boolean> => {
  const response = await fetch(`${getEffectiveApiUrl()}/presences/active/${encodeURIComponent(deviceId)}/${encodeURIComponent(slug)}`, { method: "DELETE" });
  return response.ok;
};

const deleteActivePresence = async (deviceId: string, slug: string): Promise<void> => {
  for (const attempt of [1, 2]) {
    try {
      const ok = await attemptDeleteActivePresence(deviceId, slug);
      addRuntimeLog(ok ? "success" : "warn", "api", "DELETE /presences/active/:deviceId/:slug result", { slug, attempt });

      if (ok) return;
    } catch (error) {
      addRuntimeLog("error", "api", "DELETE /presences/active/:deviceId/:slug failed", {
        slug,
        attempt,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    if (attempt === 1) await sleep(DELETE_RETRY_DELAY_MS);
  }
};

export const fetchPresenceCatalog = async (): Promise<PresenceCatalogItem[]> => {
  const response = await fetch(`${getEffectiveApiUrl()}/presences`, { cache: "no-store" });

  if (!response.ok) throw new Error(`catalog request failed: ${response.status}`);

  return normalizeCatalog(await response.json());
};

export type InstallFromApiResult = {
  error?: string;
  ok: boolean;
  queued?: boolean;
  status?: number;
};

type ReleaseDownload = {
  ok: true;
  release: PresenceRelease;
} | {
  ok: false;
  error: string;
  status?: number;
};

const downloadPresenceRelease = async (slug: string): Promise<ReleaseDownload> => {
  try {
    const response = await fetch(`${getEffectiveApiUrl()}/presences/${encodeURIComponent(slug)}`, { cache: "no-store" });

    if (!response.ok) {
      addRuntimeLog("error", "api", "GET /presences/:slug failed", {
        slug,
        status: response.status
      });
      return {
        ok: false,
        status: response.status,
        error: `release request failed: ${response.status}`
      };
    }

    return {
      ok: true,
      release: (await response.json()) as PresenceRelease
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "presence install failed";
    addRuntimeLog("error", "api", "GET /presences/:slug failed", {
      slug,
      error: message
    });
    return {
      ok: false,
      error: message
    };
  }
};

export const installPresenceFromApi = async (payload: unknown, options: {
  source?: ProductEvent["source"];
} = {}): Promise<InstallFromApiResult> => {
  const slug = typeof payload === "object" && payload !== null && "slug" in payload ? payload.slug : undefined;

  if (typeof slug !== "string" || slug.length === 0) return {
    ok: false,
    error: "MISSING_SLUG"
  };

  const download = await downloadPresenceRelease(slug);

  if (download.ok) return installPresence(
    {
      slug,
      release: download.release
    },
    options.source ?? "system"
  );

  void trackProduct({
    name: "presence_install_failed",
    source: options.source ?? "system",
    data: { stage: "download" }
  });

  if (!isRetriableInstallFailure(download.status)) return download;

  await enqueueInstall(slug, options.source);
  return {
    ...download,
    queued: true
  };
};

export const drainInstallQueue = async (): Promise<{
  slugs: string[];
}> => {
  const remaining = await drainQueuedInstalls(async ({ slug, source }) => {
    const download = await downloadPresenceRelease(slug);

    if (!download.ok) return download;

    const result = await installRelease(
      {
        slug,
        release: download.release
      },
      source ?? "system"
    );
    if (result.ok) broadcastPresencesChanged();
    return result;
  });
  return {
    slugs: remaining.map(({ slug }) => slug)
  };
};

type ToggleResult = {
  ok: boolean;
  error?: string;
};
type PresenceChange = {
  slug: string;
  presence: StoredPresence;
};

const trackToggle = (presence: StoredPresence, enabled: boolean, source: ProductEvent["source"]): void => {
  void trackProduct({
    name: enabled ? "presence_enabled" : "presence_disabled",
    source,
    data: { category: categoryOf(presence.metadata.category) }
  });
};

const enablePresenceScript = async ({ slug, presence }: PresenceChange): Promise<ToggleResult> => {
  const result = await registerPresenceScript(slug, {
    ...presence,
    enabled: true
  });
  addRuntimeLog(result.ok ? "success" : "error", "presence", "presence enabled", {
    slug,
    error: result.error
  });
  return result;
};

const installedTargets = (presences: InstalledPresences, slugs: string[]): PresenceChange[] =>
  [...new Set(slugs)].flatMap((slug) =>
    presences[slug]
      ? [
          {
            slug,
            presence: presences[slug]
          }
        ]
      : []
  );

const uninstallChanges = (
  slugs: string[]
): Promise<{
  targets: PresenceChange[];
  unregistrations: PromiseSettledResult<void>[];
}> =>
  mutatePresences((presences) => {
    const targets = installedTargets(presences, slugs);
    const unregistrations: PromiseSettledResult<void>[] = [];

    for (const { slug } of targets) delete presences[slug];

    return {
      changed: targets.length > 0,
      value: { targets, unregistrations },
      afterWrite: async () => {
        unregistrations.push(...(await Promise.allSettled(targets.map(({ slug }) => unregisterPresenceScript(slug)))));
      }
    };
  });

const removedDevicePresence = ({ slug, presence }: PresenceChange) => ({
  slug,
  version: presence.release?.version ?? presence.metadata?.version ?? undefined,
  enabled: false,
  installed: false
});

const recordRemoval = ({ slug, presence }: PresenceChange, source: ProductEvent["source"]): void => {
  addRuntimeLog("success", "presence", "presence uninstalled", {
    slug,
    version: presence.release?.version ?? presence.metadata?.version
  });
  void trackProduct({
    name: "presence_removed",
    source,
    data: { category: categoryOf(presence.metadata.category) }
  });
};

export const uninstallPresence = async ({ slug }: {
  slug: string;
}, source: ProductEvent["source"] = "extension"): Promise<{
  ok: boolean;
}> => {
  const deviceId = await getActiveDeviceId();

  const {
    targets: [removed],
    unregistrations: [unregistration]
  } = await uninstallChanges([slug]);

  if (!removed) return {
    ok: true
  };

  await syncDeviceState([removedDevicePresence(removed)]);
  recordRemoval(removed, source);
  broadcastPresencesChanged();

  if (unregistration?.status === "rejected") throw unregistration.reason;

  await removeActiveSlug(slug, "uninstall");
  await deleteActivePresence(deviceId, slug);
  if (!(await hasActiveSlugs())) await handleClearActivity();
  return {
    ok: true
  };
};

export const togglePresence = async ({ slug, enabled }: {
  slug: string;
  enabled: boolean;
}, source: ProductEvent["source"] = "extension"): Promise<ToggleResult> => {
  const deviceId = await getActiveDeviceId();

  const toggled = await mutatePresences<{
    presence?: StoredPresence;
    result: ToggleResult;
  }>(async (presences) => {
    const presence = presences[slug];

    if (!presence) return {
      changed: false,
      value: {
        result: { ok: false }
      }
    };

    if (enabled) {
      const result = await enablePresenceScript({ slug, presence });

      if (!result.ok) return {
        changed: false,
        value: { result }
      };
    }

    presences[slug] = { ...presence, enabled };
    return {
      changed: true,
      value: {
        presence,
        result: { ok: true }
      },
      afterWrite: enabled ? undefined : () => unregisterPresenceScript(slug)
    };
  });

  if (!toggled.presence) return toggled.result;

  await syncDeviceState();
  broadcastPresencesChanged();
  if (toggled.presence.enabled !== enabled) trackToggle(toggled.presence, enabled, source);
  if (enabled) return toggled.result;

  await removeActiveSlug(slug, "disabled");
  const current = await getCurrentActivity();
  if (current?.slug === slug || !(await hasActiveSlugs())) await handleClearActivity(slug);
  addRuntimeLog("info", "presence", "presence disabled", { slug });
  await deleteActivePresence(deviceId, slug);
  return toggled.result;
};

export const bulkTogglePresences = async (slugs: string[], enabled: boolean): Promise<{
  ok: boolean;
}> => {
  const deviceId = await getActiveDeviceId();

  const { targets, successful, unregistered } = await mutatePresences(async (presences) => {
    const targets = installedTargets(presences, slugs).filter(({ presence }) => presence.enabled !== enabled);

    let successful = targets;

    if (enabled) {
      const registrations = await Promise.allSettled(targets.map(enablePresenceScript));
      successful = targets.filter((_, index) => {
        const result = registrations[index];
        return result.status === "fulfilled" && result.value.ok;
      });
    }

    for (const { slug, presence } of successful) presences[slug] = { ...presence, enabled };

    const unregistered = new Set<string>();
    return {
      changed: successful.length > 0,
      value: { targets, successful, unregistered },
      afterWrite: enabled
        ? undefined
        : async () => {
            await Promise.allSettled(
              successful.map(async ({ slug }) => {
                await unregisterPresenceScript(slug);
                unregistered.add(slug);
              })
            );
          }
    };
  });

  await syncDeviceState();
  broadcastPresencesChanged();

  const results = await Promise.allSettled(
    successful.map(async ({ slug, presence }) => {
      if (enabled) {
        trackToggle(presence, true, "extension");
      } else if (unregistered.has(slug)) {
        trackToggle(presence, false, "extension");
        await deleteActivePresence(deviceId, slug);
        addRuntimeLog("info", "presence", "presence disabled", { slug });
      }
    })
  );

  if (!enabled) {
    const targetSlugs = targets.map(({ slug }) => slug);
    await removeActiveSlugs(targetSlugs, "disabled");
    const current = await getCurrentActivity();
    if (!current || targetSlugs.includes(current.slug) || !(await hasActiveSlugs())) await handleClearActivity();
  }

  return {
    ok: successful.length === targets.length && (enabled || unregistered.size === successful.length) && results.every((result) => result.status === "fulfilled")
  };
};

export const bulkUninstallPresences = async (slugs: string[]): Promise<{
  ok: boolean;
}> => {
  const deviceId = await getActiveDeviceId();

  const { targets, unregistrations } = await uninstallChanges(slugs);
  await syncDeviceState(targets.map(removedDevicePresence));
  broadcastPresencesChanged();

  await Promise.allSettled(
    targets.map(async (target, index) => {
      recordRemoval(target, "extension");
      if (unregistrations[index]?.status === "fulfilled") await deleteActivePresence(deviceId, target.slug);
    })
  );
  await removeActiveSlugs(
    targets.map(({ slug }) => slug),
    "uninstall"
  );
  if (!(await hasActiveSlugs())) await handleClearActivity();
  return {
    ok: true
  };
};

export const checkUpdates = async (): Promise<Record<string, string>> => {
  const presences = await getPresences();

  const updates: Record<string, string> = {};
  const slugs = Object.keys(presences);
  const results = await Promise.allSettled(
    slugs.map((slug) =>
      fetch(`${getEffectiveApiUrl()}/presences/${slug}`).then(async (response) => {
        if (!response.ok) {
          addRuntimeLog("warn", "api", "GET /presences/:slug failed (update check)", {
            slug,
            status: response.status
          });
          return null;
        }

        const data = (await response.json()) as {
          version?: string;
        };
        return {
          slug,
          latestVersion: data.version
        };
      })
    )
  );

  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      addRuntimeLog("error", "api", "GET /presences/:slug failed (update check)", {
        slug: slugs[index],
        error: result.reason instanceof Error ? result.reason.message : String(result.reason)
      });
      continue;
    }
    if (!result.value?.latestVersion) continue;

    const { slug, latestVersion } = result.value;
    const installed = presences[slug].release?.version;
    if (installed && latestVersion !== installed) updates[slug] = latestVersion;
  }

  return updates;
};

export const installLocalPresenceZip = async (payload: unknown): Promise<{
  ok: boolean;
  error?: string;
  slug?: string;
}> => {
  if (!IS_CANARY) {
    return {
      ok: false,
      error: "UNPACKED_BUILD_ONLY"
    };
  }

  const fileName =
    typeof payload === "object" &&
    payload !== null &&
    typeof (
      payload as {
        fileName?: unknown;
      }
    ).fileName === "string"
      ? (
          payload as {
            fileName: string;
          }
        ).fileName
      : "presence.zip";
  const bytes =
    typeof payload === "object" && payload !== null
      ? (
          payload as {
            bytes?: unknown;
          }
        ).bytes
      : payload;

  const parsed = await parsePresenceZip(bytes, fileName);

  if (!parsed.ok) return parsed;

  const release = await toLocalRelease(parsed.slug, parsed.metadata, parsed.bundle, parsed.iframeBundle);

  const installed = await installPresence({
    slug: parsed.slug,
    release,
    source: "local"
  });

  if (!installed.ok) return installed;

  return {
    ok: true,
    slug: parsed.slug
  };
};

const readDevPresences = async (): Promise<BundledPresence[]> => {
  if (!IS_CANARY) return [];

  try {
    const response = await fetch(chrome.runtime.getURL("dev-presences.json"));

    if (!response.ok) return [];

    const releases: unknown = await response.json();
    return Array.isArray(releases) ? releases.filter((item: BundledPresence | null) => item?.release) : [];
  } catch {
    return [];
  }
};

const installPackagedPresences = (presences: InstalledPresences, releases: readonly BundledPresence[], source?: StoredPresence["source"]): boolean => {
  let changed = false;

  for (const { slug, release } of releases) {
    const existing = presences[slug];

    if (existing?.release?.version === release.version) continue;

    presences[slug] = {
      metadata: release.metadata,
      release,
      enabled: true,
      installedAt: existing?.installedAt ?? Date.now(),
      updatedAt: Date.now(),
      ...(source ? { source } : {})
    };
    changed = true;
  }

  return changed;
};

export const installBundledPresences = async (): Promise<void> => {
  if (!BUNDLED_PRESENCES.length && !IS_CANARY) return;

  const devPresences = await readDevPresences();

  const changed = await mutatePresences((presences) => {
    const devChanged = installPackagedPresences(presences, devPresences);
    const bundledChanged = installPackagedPresences(presences, BUNDLED_PRESENCES, "bundle");
    const changed = devChanged || bundledChanged;
    return {
      changed,
      value: changed
    };
  });

  if (!changed) return;

  await syncDeviceState();
  broadcastPresencesChanged();
};

export type PresenceEngagement = {
  liked: boolean;
  likeCount: number;
  totalInstalls: number;
  activeUsers: number;
};

export const fetchPresenceEngagement = async (slug: string): Promise<PresenceEngagement> => {
  const deviceId = await getActiveDeviceId();

  const [likeRes, statsRes] = await Promise.all([
    fetch(`${getEffectiveApiUrl()}/presences/${encodeURIComponent(slug)}/like?deviceId=${encodeURIComponent(deviceId)}`),
    fetch(`${getEffectiveApiUrl()}/presences/${encodeURIComponent(slug)}/stats`)
  ]);

  const like = likeRes.ok
    ? ((await likeRes.json()) as {
        liked: boolean;
        count: number;
      })
    : { liked: false, count: 0 };
  const stats = statsRes.ok
    ? ((await statsRes.json()) as {
        totalInstalls: number;
        activeUsers: number;
      })
    : { totalInstalls: 0, activeUsers: 0 };

  return {
    liked: like.liked,
    likeCount: like.count,
    totalInstalls: stats.totalInstalls,
    activeUsers: stats.activeUsers
  };
};

export const setPresenceLike = async (slug: string, liked: boolean): Promise<{
  ok: boolean;
  count: number;
}> => {
  const deviceId = await getActiveDeviceId();

  const token = await getDeviceToken();

  const url = liked
    ? `${getEffectiveApiUrl()}/presences/${encodeURIComponent(slug)}/like`
    : `${getEffectiveApiUrl()}/presences/${encodeURIComponent(slug)}/like?deviceId=${encodeURIComponent(deviceId)}`;

  try {
    const response = await fetch(url, {
      method: liked ? "POST" : "DELETE",
      headers: { ...(liked ? { "Content-Type": "application/json" } : {}), ...(token ? { "X-Device-Token": token } : {}) },
      body: liked ? JSON.stringify({ deviceId }) : undefined
    });

    if (!response.ok) return {
      ok: false,
      count: 0
    };

    return (await response.json()) as {
      ok: boolean;
      count: number;
    };
  } catch {
    return {
      ok: false,
      count: 0
    };
  }
};