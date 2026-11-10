import { addRuntimeLog } from "@/background/runtime-logs";
import { getCachedDeviceId, setCachedDeviceId } from "@/background/services/background-context";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { browserName, osName } from "@/background/services/device-info";
import { getDeviceId, getDeviceToken, setDeviceToken } from "@/background/storage/device.store";
import { getPresences } from "@/background/storage/presences.store";
import { createSerialQueue } from "@/background/storage/serial-queue";
import { LOCALE_LONG_MAP, loadLocale } from "@/shared/locales";
import { WEB_BASE_URL } from "@/shared/constants";

const DEVICE_SYNC_TIMEOUT_MS = 10_000;
const serializeDeviceSync = createSerialQueue();

type SyncPresence = {
  slug: string;
  version?: string;
  enabled?: boolean;
  installed?: boolean;
};

export const getActiveDeviceId = async (): Promise<string> => {
  const cachedDeviceId = getCachedDeviceId();

  if (cachedDeviceId) return cachedDeviceId;

  const deviceId = await getDeviceId();
  setCachedDeviceId(deviceId);
  return deviceId;
};

export const buildDeviceUrl = async (path: string): Promise<string> => {
  const deviceId = await getActiveDeviceId();

  const params = new URLSearchParams({ deviceId });
  const token = await getDeviceToken();
  if (token) params.set("token", token);
  return `${WEB_BASE_URL}${path}?${params.toString()}`;
};

export const syncUninstallUrl = async (): Promise<void> => {
  try {
    chrome.runtime.setUninstallURL(await buildDeviceUrl("/uninstall"));
  } catch (error) {
    addRuntimeLog("warn", "api", "Uninstall URL update failed", { error: error instanceof Error ? error.message : String(error) });
  }
};

export const syncDeviceState = (removedPresences: SyncPresence[] = []): Promise<void> =>
  serializeDeviceSync(async () => {
    const [deviceId, presences] = await Promise.all([
      getActiveDeviceId(),
      getPresences()
    ]);

    const syncedPresences = [
      ...Object.entries(presences).map(([slug, presence]) => ({
        slug,
        version: presence.release?.version ?? presence.metadata?.version ?? undefined,
        enabled: presence.enabled,
        installed: true
      })),
      ...removedPresences.filter(({ slug }) => !Object.hasOwn(presences, slug))
    ];

    addRuntimeLog("info", "api", "POST /devices/sync", { presenceCount: syncedPresences.length });

    try {
      const response = await fetch(`${getEffectiveApiUrl()}/devices/sync`, {
        method: "POST",
        signal: AbortSignal.timeout(DEVICE_SYNC_TIMEOUT_MS),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          extensionVersion: chrome.runtime.getManifest().version,
          browser: browserName(),
          os: osName(),
          locale: LOCALE_LONG_MAP[await loadLocale()],
          presences: syncedPresences
        })
      });
      addRuntimeLog(response.ok ? "success" : "warn", "api", "POST /devices/sync result", { status: response.status });

      if (response.ok) {
        try {
          const data = (await response.json()) as {
            deviceToken?: unknown;
          };

          if (typeof data.deviceToken === "string" && data.deviceToken) {
            const existing = await getDeviceToken();

            if (existing !== data.deviceToken) {
              await setDeviceToken(data.deviceToken);
              await syncUninstallUrl();
            }
          }
        } catch (error) {
          addRuntimeLog("warn", "api", "Device token could not be stored", { error: error instanceof Error ? error.message : String(error) });
        }
      }
    } catch (error) {
      addRuntimeLog("error", "api", "POST /devices/sync failed", { error: error instanceof Error ? error.message : String(error) });
    }
  });