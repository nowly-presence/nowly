const CDN_BASE_URL = "https://cdn.nowly.me";
export const PRODUCTION_API_URL = "https://api.nowly.me";

export const presenceLogoUrl = (slug: string): string =>
  `${CDN_BASE_URL}/presences/${encodeURIComponent(slug)}/assets/logo.png`;

export const presenceThumbnailUrl = (slug: string): string =>
  `${CDN_BASE_URL}/presences/${encodeURIComponent(slug)}/assets/thumbnail.jpg`;

export const presenceApiBaseUrl = (): string =>
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? PRODUCTION_API_URL).replace(/\/$/, "");

export const fetchPresenceRelease = async (slug: string): Promise<unknown> => {
  const response = await fetch(`/api/presences/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`release request failed: ${response.status}`);
  }
  return response.json();
};
