import { downloadJsonFile } from "@/lib/download-json-file";
import { sendMessage } from "@/lib/messages";

const LOCAL_KEYS = ["settings", "presenceSettings", "deviceId"];

export const exportDeviceData = async (installedSlugs: string[]): Promise<boolean> => {
  const [result, local] = await Promise.all([
    sendMessage("EXPORT_DEVICE_DATA"),
    chrome.storage.local.get(LOCAL_KEYS)
  ]);

  if (!result.ok && result.error !== "DEVICE_TOKEN_MISSING") return false;

  const exportedAt = new Date().toISOString();
  downloadJsonFile(`nowly-data-${exportedAt.slice(0, 10)}.json`, {
    exportedAt,
    extensionVersion: chrome.runtime.getManifest().version,
    local: {
      ...local,
      installedPresences: installedSlugs
    },
    server: result.ok ? result.data : null
  });
  return true;
};