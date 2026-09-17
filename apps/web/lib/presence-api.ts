import {
  isLibraryCategory,
  type LibraryPresence,
  type LocalizedCopy,
  type LocalizedList,
  type PresencePerson,
} from "@/lib/library-catalog";
import { PRESENCES_REPOSITORY_URL } from "@/lib/constants";
import { cache } from "react";

const CDN_BASE_URL = "https://cdn.nowly.me";
export const PRODUCTION_API_URL = "https://api.nowly.me";

export type PresencePlatform = {
  slug: string
  name: string
  logoUrl: string
};

export const presenceLogoUrl = (slug: string): string =>
  `${CDN_BASE_URL}/presences/${encodeURIComponent(slug)}/assets/logo.png`;

export const presenceThumbnailUrl = (slug: string): string =>
  `${CDN_BASE_URL}/presences/${encodeURIComponent(slug)}/assets/thumbnail.jpg`;

export const presenceApiBaseUrl = (): string =>
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

const emptyList = (): LocalizedList => ({
  "en-US": [],
  "fr-FR": [],
  "es-ES": [],
});

const stringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => (typeof item === "string" && item.trim() ? [item.trim()] : []));
};

const localizedList = (value: unknown): LocalizedList => {
  const list = emptyList();
  if (!value || typeof value !== "object" || Array.isArray(value)) return list;
  const localized = value as Record<string, unknown>;
  for (const locale of ["en-US", "fr-FR", "es-ES"] as const) {
    list[locale] = stringList(localized[locale]);
  }
  const first = Object.values(localized).map(stringList).find((items) => items.length > 0) ?? [];
  if (list["en-US"].length === 0) list["en-US"] = first;
  if (list["fr-FR"].length === 0) list["fr-FR"] = first;
  if (list["es-ES"].length === 0) list["es-ES"] = first;
  return list;
};

const parsePerson = (value: unknown, fallbackName: string): PresencePerson => {
  if (typeof value === "string" && value.trim()) return { name: value.trim() };
  if (value && typeof value === "object") {
    const person = value as { name?: unknown; github?: unknown };
    const name = typeof person.name === "string" && person.name.trim()
      ? person.name.trim()
      : typeof person.github === "string" && person.github.trim()
        ? person.github.trim()
        : fallbackName;
    const github = typeof person.github === "string" && person.github.trim()
      ? person.github.trim().replace(/^@/, "")
      : undefined;
    return github ? { name, github } : { name };
  }
  return { name: fallbackName };
};

const parsePeople = (value: unknown, fallbackName: string): PresencePerson[] => {
  if (!Array.isArray(value)) return [];
  return value.map((person) => parsePerson(person, fallbackName));
};

const parseUrls = (value: unknown): string[] => {
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return stringList(value);
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
  return fetchCatalog(PRODUCTION_API_URL);
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
        longDescription?: unknown
        features?: unknown
        url?: unknown
        author?: unknown
        contributors?: unknown
        version?: unknown
        totalInstalls?: unknown
        discordNative?: unknown
      };
      if (typeof item.slug !== "string") return [];
      const slug = item.slug.trim().toLowerCase();
      if (!slug) return [];
      const name = displayName(item.name, slug);
      const description = localizedCopy(item.description, name);

      return [{
        slug,
        name,
        category: typeof item.category === "string" && isLibraryCategory(item.category)
          ? item.category
          : "other",
        color: typeof item.color === "string" && item.color.trim() ? item.color.trim() : "#111111",
        description,
        longDescription: localizedCopy(item.longDescription, description["en-US"]),
        features: localizedList(item.features),
        urls: parseUrls(item.url),
        author: parsePerson(item.author, name),
        contributors: parsePeople(item.contributors, name),
        version: typeof item.version === "string" && item.version.trim() ? item.version.trim() : null,
        discordNative: item.discordNative === true,
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

export const getPresenceBySlug = cache(async (slug: string): Promise<LibraryPresence | null> => {
  const catalog = await getPresenceCatalog();
  const normalized = slug.trim().toLowerCase();
  return catalog.find((presence) => presence.slug === normalized) ?? null;
});

const COMMIT_SHA = /^[a-f0-9]{7,40}$/i;

export type PresenceCommit = {
  sha: string
  shortSha: string
  href: string
};

export const getLatestPresenceCommit = cache(async (slug: string, version?: string | null): Promise<PresenceCommit | null> => {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  try {
    const response = await fetch(
      `${PRODUCTION_API_URL}/presences/${encodeURIComponent(normalized)}/versions`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!Array.isArray(data)) return null;

    const rows = data.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const entry = row as { version?: unknown; commitSha?: unknown };
      const sha = typeof entry.commitSha === "string" ? entry.commitSha.trim() : "";
      if (!COMMIT_SHA.test(sha)) return [];
      return [{
        version: typeof entry.version === "string" ? entry.version : "",
        sha,
      }];
    });

    const matched = (version
      ? rows.find((row) => row.version === version)
      : null) ?? rows[0];
    if (!matched) return null;

    return {
      sha: matched.sha,
      shortSha: matched.sha.slice(0, 7),
      href: `${PRESENCES_REPOSITORY_URL}/commit/${matched.sha}`,
    };
  } catch {
    return null;
  }
});

export const fetchPresenceRelease = async (slug: string): Promise<unknown> => {
  const response = await fetch(`/api/presences/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`release request failed: ${response.status}`);
  }
  return response.json();
};
