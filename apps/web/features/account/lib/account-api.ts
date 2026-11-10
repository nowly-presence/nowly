import { presenceApiBaseUrl } from "@/lib/presence-api-client";

export type AccountUser = {
  id: string;
  name: string;
  image: string | null;
  discordId: string | null;
  githubLogin: string | null;
};

type ExtensionSessionPayload = {
  token: string;
  user: AccountUser;
  providers: string[];
  expiresAt: number;
};

const apiUrl = (path: string): string => `${presenceApiBaseUrl()}${path}`;

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

export const createExtensionSession = async (deviceId: string | null, permission: "creator" | "admin" | null = null): Promise<ExtensionSessionPayload> => {
  const response = await request("/extension/tokens", {
    method: "POST",
    body: JSON.stringify({
      ...(deviceId ? { deviceId } : {}),
      scopes: permission === "admin" ? ["sync", "creator", "admin"] : permission === "creator" ? ["sync", "creator"] : ["sync"]
    })
  });

  if (!response.ok) throw new Error(`HTTP_${response.status}`);

  return (await response.json()) as ExtensionSessionPayload;
};