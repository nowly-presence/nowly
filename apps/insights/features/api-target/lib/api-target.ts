export type ApiTarget = "dev" | "prod";

export const API_TARGET_COOKIE = "nowly_insights_api_target";
export const DEFAULT_API_TARGET: ApiTarget = "prod";

export const API_TARGETS: Record<ApiTarget, string> = {
  dev: process.env.NEXT_PUBLIC_API_URL_DEV ?? "https://dev.api.nowly.me",
  prod: process.env.NEXT_PUBLIC_API_URL_PROD ?? "https://api.nowly.me",
};

export const resolveApiTarget = (value: string | undefined | null): ApiTarget =>
  value === "dev" ? "dev" : DEFAULT_API_TARGET;

export const apiBaseUrlFor = (target: ApiTarget): string => API_TARGETS[target];

const readCookie = (name: string): string | undefined => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
};

export const getClientApiTarget = (): ApiTarget => resolveApiTarget(readCookie(API_TARGET_COOKIE));

export const setClientApiTarget = (target: ApiTarget): void => {
  document.cookie = `${API_TARGET_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
};

export const getClientApiBaseUrl = (): string => apiBaseUrlFor(getClientApiTarget());
