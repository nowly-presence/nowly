const PRODUCTION_API_URL = "https://api.nowly.me";
const CDN_BASE_URL = "https://cdn.nowly.me";
const PRODUCTION_SITE_URL = "https://nowly.me";

export const apiBaseUrl = (): string => (process.env.NEXT_PUBLIC_API_BASE_URL ?? PRODUCTION_API_URL).replace(/\/$/, "");

export const siteBaseUrl = (): string => (process.env.NEXT_PUBLIC_BASE_URL ?? PRODUCTION_SITE_URL).replace(/\/$/, "");

export const presenceLogoUrl = (slug: string): string => `${CDN_BASE_URL}/presences/${encodeURIComponent(slug)}/assets/logo.png`;