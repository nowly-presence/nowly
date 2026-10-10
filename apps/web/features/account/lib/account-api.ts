import { presenceApiBaseUrl } from "@/lib/presence-api-client";

export type AccountUser = {
  id: string
  name: string
  image: string | null
  discordId: string | null
  githubLogin: string | null
};

export type ExtensionSessionPayload = {
  token: string
  user: AccountUser
  providers: string[]
  expiresAt: number
};

export type AccountDevice = {
  deviceId: string
  browser: string | null
  os: string | null
  extensionVersion: string | null
  lastSeenAt: string
  current: boolean
};

const apiUrl = (path: string): string => `${presenceApiBaseUrl()}${path}`;

const request = async (path: string, init: RequestInit = {}): Promise<Response> =>
  fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: init.body ? { "Content-Type": "application/json", ...init.headers } : init.headers,
  });

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const fetchAccountUser = async (): Promise<AccountUser | null> => {
  const response = await request("/me");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return (await response.json()) as AccountUser;
};

export const startDiscordSignIn = async (callbackURL: string): Promise<void> => {
  const response = await request("/auth/sign-in/social", {
    method: "POST",
    body: JSON.stringify({ provider: "discord", callbackURL, errorCallbackURL: callbackURL }),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok || !isObject(body) || typeof body.url !== "string") throw new Error("SIGN_IN_FAILED");
  window.location.assign(body.url);
};

export const signOutAccount = async (): Promise<void> => {
  await request("/auth/sign-out", { method: "POST", body: "{}" });
};

export const createExtensionSession = async (deviceId: string | null): Promise<ExtensionSessionPayload> => {
  const response = await request("/extension/tokens", {
    method: "POST",
    body: JSON.stringify({ ...(deviceId ? { deviceId } : {}), scopes: ["sync"] }),
  });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return (await response.json()) as ExtensionSessionPayload;
};

export const fetchAccountDevices = async (): Promise<AccountDevice[]> => {
  const response = await request("/me/devices");
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  const body = (await response.json()) as { devices: AccountDevice[] };
  return body.devices;
};

export const unlinkAccountDevice = async (deviceId: string): Promise<void> => {
  const response = await request(`/me/devices/${encodeURIComponent(deviceId)}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
};

export const downloadAccountExport = async (): Promise<void> => {
  const response = await request("/me/export");
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  const blob = new Blob([JSON.stringify(await response.json(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "nowly-account-data.json";
  anchor.click();
  URL.revokeObjectURL(url);
};

export const deleteAccount = async (): Promise<void> => {
  const response = await request("/me", { method: "DELETE" });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
};
