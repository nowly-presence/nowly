import { cache } from "react";

const CDN_BASE_URL = "https://cdn.nowly.me";
const PRODUCTION_API_URL = "https://api.nowly.me";

export type PresencePlatform = {
  slug: string
  name: string
  logoUrl: string
};

export const presenceLogoUrl = (slug: string): string =>
  `${CDN_BASE_URL}/presences/${encodeURIComponent(slug)}/assets/logo.png`;

const apiBaseUrl = (): string =>
  (process.env.PRESENCE_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? PRODUCTION_API_URL)
    .replace(/\/$/, "");

const displayName = (name: unknown, slug: string): string => {
  if (typeof name === "string" && name.trim()) return name.trim();
  if (name && typeof name === "object") {
    const localized = name as Record<string, unknown>;
    const value = localized["en-US"] ?? Object.values(localized)[0];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return slug;
};

const fetchCatalog = async (baseUrl: string): Promise<unknown[]> => {
  try {
    const response = await fetch(`${baseUrl}/presences`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const data: unknown = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const getPresencePlatforms = cache(async (): Promise<PresencePlatform[]> => {
  const primary = apiBaseUrl();
  let rows = await fetchCatalog(primary);
  if (rows.length === 0 && primary !== PRODUCTION_API_URL) {
    rows = await fetchCatalog(PRODUCTION_API_URL);
  }

  return rows
    .flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const item = row as { slug?: unknown; name?: unknown; totalInstalls?: unknown };
      if (typeof item.slug !== "string") return [];
      const slug = item.slug.trim().toLowerCase();
      if (!slug) return [];

      return [{
        slug,
        name: displayName(item.name, slug),
        logoUrl: presenceLogoUrl(slug),
        totalInstalls: typeof item.totalInstalls === "number" ? item.totalInstalls : 0,
      }];
    })
    .toSorted((a, b) => b.totalInstalls - a.totalInstalls || a.name.localeCompare(b.name))
    .map(({ slug, name, logoUrl }) => ({ slug, name, logoUrl }));
});
