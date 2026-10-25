export const CUSTOM_ACTIVITY_DETECTION_KEY = "customActivityDetection";
export const CUSTOM_ACTIVITY_DETECTION_DISMISSED_KEY = "customActivityDetectionDismissed";

const WILDCARD_PREFIX = "*.";
const LEADING_WWW = /^www\./;
const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;
const INVALID_HOST_CHARS = /[^a-z0-9.-]/;
const TRAILING_SLASHES = /\/+$/;
const TRAILING_WILDCARDS = /\*+$/;

export type CustomDetectionTarget = {
  host: string;
  path: string;
};

const normalizeHost = (hostname: string): string | null => {
  const lower = hostname.toLowerCase().replace(/\.$/, "");
  const wildcard = lower.startsWith(WILDCARD_PREFIX);
  const host = (wildcard ? lower.slice(WILDCARD_PREFIX.length) : lower).replace(LEADING_WWW, "");

  if (!host || host.includes("..") || INVALID_HOST_CHARS.test(host)) return null;
  if (host.startsWith(".") || host.endsWith(".") || host.startsWith("-") || host.endsWith("-")) return null;

  return wildcard ? `${WILDCARD_PREFIX}${host}` : host;
};

const normalizePath = (pathname: string): string => pathname.replace(TRAILING_WILDCARDS, "").replace(TRAILING_SLASHES, "").toLowerCase();

export const parseDetectionUrl = (value: string): CustomDetectionTarget | null => {
  const trimmed = value.trim();

  if (!trimmed) return null;

  const candidate = SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;

  const host = normalizeHost(url.hostname);

  if (!host) return null;
  if (!host.includes(".") && host !== "localhost") return null;

  return {
    host,
    path: normalizePath(url.pathname)
  };
};

const hostMatches = (target: string, host: string): boolean =>
  target.startsWith(WILDCARD_PREFIX)
    ? host === target.slice(WILDCARD_PREFIX.length) || host.endsWith(`.${target.slice(WILDCARD_PREFIX.length)}`)
    : host === target;

export const matchesDetectionUrl = (value: string, url: string | undefined): boolean => {
  if (!url) return false;

  const target = parseDetectionUrl(value);

  if (!target) return false;

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

  const host = normalizeHost(parsed.hostname);

  if (!host || !hostMatches(target.host, host)) return false;
  if (!target.path) return true;

  const path = normalizePath(parsed.pathname);

  return path === target.path || path.startsWith(`${target.path}/`);
};

export const detectionHost = (value: string): string => {
  const host = parseDetectionUrl(value)?.host ?? "";
  return host.startsWith(WILDCARD_PREFIX) ? host.slice(WILDCARD_PREFIX.length) : host;
};