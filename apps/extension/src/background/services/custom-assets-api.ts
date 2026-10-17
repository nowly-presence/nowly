import { addRuntimeLog } from "@/background/runtime-logs";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { getActiveDeviceId, syncDeviceState } from "@/background/services/device-sync";
import { getDeviceToken } from "@/background/storage/device.store";
import type { CustomImageMime } from "@/shared/types";

export type CustomAssetResult = {
  ok: true;
  url: string;
  id: string;
} | {
  ok: false;
  error: string;
  status?: number;
};

type AssetBody = {
  id?: unknown;
  url?: unknown;
  error?: unknown;
};

const assetEndpoint = async (hash: string, suffix = ""): Promise<{
  url: string;
  token: string;
} | null> => {
  let token = await getDeviceToken();

  if (!token) {
    await syncDeviceState();
    token = await getDeviceToken();
  }

  if (!token) return null;

  const deviceId = await getActiveDeviceId();
  return {
    url: `${getEffectiveApiUrl()}/devices/${encodeURIComponent(deviceId)}/custom-assets/${hash}${suffix}`,
    token
  };
};

const readAsset = async (response: Response): Promise<CustomAssetResult> => {
  const body = (await response.json().catch(() => null)) as AssetBody | null;

  if (!response.ok) return {
    ok: false,
    status: response.status,
    error: typeof body?.error === "string" ? body.error : `HTTP_${response.status}`
  };
  if (typeof body?.url !== "string" || !body.url.startsWith("https://")) return {
    ok: false,
    error: "INVALID_RESPONSE"
  };

  return {
    ok: true,
    url: body.url,
    id: typeof body.id === "string" ? body.id : ""
  };
};

const request = async (hash: string, init: RequestInit, suffix = ""): Promise<CustomAssetResult> => {
  const endpoint = await assetEndpoint(hash, suffix);

  if (!endpoint) return {
    ok: false,
    error: "DEVICE_TOKEN_MISSING"
  };

  try {
    const response = await fetch(endpoint.url, {
      ...init,
      headers: {
        ...init.headers,
        "X-Device-Token": endpoint.token
      }
    });

    const result = await readAsset(response);
    addRuntimeLog(result.ok ? "success" : "warn", "api", `${init.method} /devices/:deviceId/custom-assets/:hash${suffix} result`, { status: response.status });
    return result;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "NETWORK_ERROR"
    };
  }
};

export const uploadCustomAsset = (hash: string, bytes: Uint8Array, mime: CustomImageMime): Promise<CustomAssetResult> =>
  request(hash, {
    method: "PUT",
    headers: { "Content-Type": mime },
    body: new Blob([new Uint8Array(bytes)], { type: mime })
  });

export const touchCustomAsset = (hash: string): Promise<CustomAssetResult> => request(hash, { method: "POST" }, "/touch");

export const deleteCustomAsset = async (hash: string): Promise<void> => {
  const endpoint = await assetEndpoint(hash);

  if (!endpoint) return;

  await fetch(endpoint.url, {
    method: "DELETE",
    headers: { "X-Device-Token": endpoint.token }
  }).catch(() => undefined);
};