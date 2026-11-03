import { apiBaseUrl } from "@/lib/api-base";
import type { AdminCapability, ExtensionTokenScope } from "@nowly/shared";

export type AccountUser = {
  id: string;
  name: string;
  image: string | null;
  discordId: string | null;
  githubLogin: string | null;
  role: string;
  verified: boolean;
  capabilities: AdminCapability[];
};

export type ExtensionSessionPayload = {
  token: string;
  user: AccountUser;
  providers: string[];
  expiresAt: number;
};

export type AccountDevice = {
  deviceId: string;
  browser: string | null;
  os: string | null;
  extensionVersion: string | null;
  lastSeenAt: string;
  current: boolean;
};

const apiUrl = (path: string): string => `${apiBaseUrl()}${path}`;

const request = async (path: string, init: RequestInit = {}): Promise<Response> =>
  fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: init.body ? { "Content-Type": "application/json", ...init.headers } : init.headers
  });

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const fetchAccountUser = async (): Promise<AccountUser | null> => {
  const response = await request("/me");

  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`HTTP_${response.status}`);

  return (await response.json()) as AccountUser;
};

export const startDiscordSignIn = async (callbackURL: string): Promise<void> => {
  const response = await request("/auth/sign-in/social", {
    method: "POST",
    body: JSON.stringify({
      provider: "discord",
      callbackURL,
      errorCallbackURL: callbackURL
    })
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok || !isObject(body) || typeof body.url !== "string") throw new Error("SIGN_IN_FAILED");

  window.location.assign(body.url);
};

export const signOutAccount = async (): Promise<void> => {
  await request("/auth/sign-out", {
    method: "POST",
    body: "{}"
  });
};

export const createExtensionSession = async (deviceId: string | null, scopes: ExtensionTokenScope[] = ["sync"]): Promise<ExtensionSessionPayload> => {
  const response = await request("/extension/tokens", {
    method: "POST",
    body: JSON.stringify({ ...(deviceId ? { deviceId } : {}), scopes })
  });

  if (!response.ok) throw new Error(response.status === 403 ? "ADMIN_REQUIRED" : `HTTP_${response.status}`);

  return (await response.json()) as ExtensionSessionPayload;
};

export const fetchAccountDevices = async (): Promise<AccountDevice[]> => {
  const response = await request("/me/devices");

  if (!response.ok) throw new Error(`HTTP_${response.status}`);

  const body = (await response.json()) as {
    devices: AccountDevice[];
  };
  return body.devices;
};

export type AccountPresence = {
  slug: string;
  name: string;
  enabled: boolean;
  installedAt: number;
};

export const fetchAccountPresences = async (): Promise<AccountPresence[]> => {
  const response = await request("/me/presences");

  if (!response.ok) throw new Error(`HTTP_${response.status}`);

  const body = (await response.json()) as {
    presences: AccountPresence[];
  };
  return body.presences;
};

export type AccountCustomActivity = {
  id: string;
  name: string;
  details: string;
  state: string;
  updatedAt: number;
};

export const fetchAccountCustomActivities = async (): Promise<AccountCustomActivity[]> => {
  const response = await request("/me/custom-activities");

  if (!response.ok) throw new Error(`HTTP_${response.status}`);

  const body = (await response.json()) as {
    activities: AccountCustomActivity[];
  };
  return body.activities;
};

export const unlinkAllAccountDevices = async (): Promise<void> => {
  const response = await request("/me/devices", { method: "DELETE" });

  if (!response.ok) throw new Error(`HTTP_${response.status}`);
};

export type AdminUser = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  role: string;
  verified: boolean;
};

export const searchAdminUsers = async (query: string): Promise<AdminUser[]> => {
  const response = await request(`/admin/users?q=${encodeURIComponent(query)}`);

  if (!response.ok) throw new Error(`HTTP_${response.status}`);

  const body = (await response.json()) as {
    users: AdminUser[];
  };
  return body.users;
};

export const setAdminUserVerified = async (userId: string, verified: boolean): Promise<void> => {
  const response = await request(`/admin/users/${encodeURIComponent(userId)}/verified`, {
    method: "PUT",
    body: JSON.stringify({ verified })
  });

  if (!response.ok) throw new Error(`HTTP_${response.status}`);
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

export type PublicProfileSettings = {
  enabled: boolean;
  handle: string | null;
  bio: string | null;
  showCreated: boolean;
  showLiked: boolean;
  links: string[];
};

export class PublicProfileError extends Error {
  readonly code: "HANDLE_TAKEN" | "INVALID" | "FAILED";

  constructor(code: "HANDLE_TAKEN" | "INVALID" | "FAILED") {
    super(code);
    this.code = code;
  }
}

export const fetchPublicProfileSettings = async (): Promise<PublicProfileSettings> => {
  const response = await request("/me/public-profile");

  if (!response.ok) throw new Error(`HTTP_${response.status}`);

  return (await response.json()) as PublicProfileSettings;
};

export const savePublicProfileSettings = async (settings: Omit<PublicProfileSettings, "handle">): Promise<PublicProfileSettings> => {
  const response = await request("/me/public-profile", {
    method: "PUT",
    body: JSON.stringify({
      ...settings,
      bio: settings.bio ?? ""
    })
  });

  if (response.ok) return (await response.json()) as PublicProfileSettings;
  if (response.status === 409) throw new PublicProfileError("HANDLE_TAKEN");
  if (response.status === 400) throw new PublicProfileError("INVALID");

  throw new PublicProfileError("FAILED");
};