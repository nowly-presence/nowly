import {
  isLibraryCategory,
  type LibraryPresence,
  type LocalizedCopy,
} from "@/lib/library-catalog";
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

export const presenceThumbnailUrl = (slug: string): string =>
  `${CDN_BASE_URL}/presences/${encodeURIComponent(slug)}/assets/thumbnail.jpg`;

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

const emptyCopy = (): LocalizedCopy => ({
  "en-US": "",
  "fr-FR": "",
  "es-ES": "",
});

const localizedCopy = (value: unknown, fallback: string): LocalizedCopy => {
  const copy = emptyCopy();
  if (typeof value === "string" && value.trim()) {
    copy["en-US"] = value.trim();
    copy["fr-FR"] = value.trim();
    copy["es-ES"] = value.trim();
    return copy;
  }
  if (value && typeof value === "object") {
    const localized = value as Record<string, unknown>;
    for (const locale of ["en-US", "fr-FR", "es-ES"] as const) {
      const text = localized[locale];
      if (typeof text === "string" && text.trim()) copy[locale] = text.trim();
    }
    const first = Object.values(localized).find((text) => typeof text === "string" && text.trim());
    if (typeof first === "string") {
      if (!copy["en-US"]) copy["en-US"] = first.trim();
      if (!copy["fr-FR"]) copy["fr-FR"] = first.trim();
      if (!copy["es-ES"]) copy["es-ES"] = first.trim();
    }
  }
  if (!copy["en-US"]) copy["en-US"] = fallback;
  if (!copy["fr-FR"]) copy["fr-FR"] = fallback;
  if (!copy["es-ES"]) copy["es-ES"] = fallback;
  return copy;
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

const loadCatalogRows = async (): Promise<unknown[]> => {
  const primary = apiBaseUrl();
  let rows = await fetchCatalog(primary);
  if (rows.length === 0 && primary !== PRODUCTION_API_URL) {
    rows = await fetchCatalog(PRODUCTION_API_URL);
  }
  return rows;
};

export const getPresenceCatalog = cache(async (): Promise<LibraryPresence[]> => {
  const rows = await loadCatalogRows();

  return rows
    .flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const item = row as {
        slug?: unknown
        name?: unknown
        category?: unknown
        color?: unknown
        description?: unknown
        totalInstalls?: unknown
      };
      if (typeof item.slug !== "string") return [];
      const slug = item.slug.trim().toLowerCase();
      if (!slug) return [];
      const name = displayName(item.name, slug);

      return [{
        slug,
        name,
        category: typeof item.category === "string" && isLibraryCategory(item.category)
          ? item.category
          : "other",
        color: typeof item.color === "string" && item.color.trim() ? item.color.trim() : "#111111",
        description: localizedCopy(item.description, name),
        totalInstalls: typeof item.totalInstalls === "number" ? item.totalInstalls : 0,
      }];
    })
    .toSorted((a, b) => b.totalInstalls - a.totalInstalls || a.name.localeCompare(b.name))
    .map(({ totalInstalls: _installs, ...presence }) => presence);
});

export const getPresencePlatforms = cache(async (): Promise<PresencePlatform[]> => {
  const catalog = await getPresenceCatalog();
  return catalog.map((presence) => ({
    slug: presence.slug,
    name: presence.name,
    logoUrl: presenceLogoUrl(presence.slug),
  }));
});
