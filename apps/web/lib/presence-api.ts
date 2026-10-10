import "server-only";

import {
  isLibraryCategory,
  type LibraryPresence,
  type LocalizedCopy,
  type LocalizedList,
  type PresencePerson,
} from "@/lib/library-catalog";
import { PRESENCES_REPOSITORY_URL } from "@/lib/constants";
import { PRODUCTION_API_URL, presenceLogoUrl } from "@/lib/presence-api-client";
import { FALLBACK_LOCALE, SUPPORTED_LOCALES, type LocaleString } from "@nowly/locales";

import { cache } from "react";

export { PRODUCTION_API_URL, presenceLogoUrl, presenceThumbnailUrl } from "@/lib/presence-api-client";

export type PresencePlatform = {
  slug: string
  name: string
  logoUrl: string
};

export const presenceApiBaseUrl = (): string =>
  (process.env.PRESENCE_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? PRODUCTION_API_URL)
    .replace(/\/$/, "");

const displayName = (name: unknown, slug: string): string => {
  if (typeof name === "string" && name.trim()) return name.trim();
  if (name && typeof name === "object") {
    const localized = name as Record<string, unknown>;
    const value = localized[FALLBACK_LOCALE] ?? Object.values(localized)[0];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return slug;
};

const emptyCopy = (): LocalizedCopy =>
  Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, ""])) as LocalizedCopy;

const localizedCopy = (value: unknown, fallback: string): LocalizedCopy => {
  const copy = emptyCopy();
  if (typeof value === "string" && value.trim()) {
    for (const locale of SUPPORTED_LOCALES) copy[locale] = value.trim();
    return copy;
  }
  if (value && typeof value === "object") {
    const localized = value as Record<string, unknown>;
    for (const locale of SUPPORTED_LOCALES) {
      const text = localized[locale];
      if (typeof text === "string" && text.trim()) copy[locale] = text.trim();
    }
    const first = Object.values(localized).find((text) => typeof text === "string" && text.trim());
    if (typeof first === "string") {
      for (const locale of SUPPORTED_LOCALES) {
        if (!copy[locale]) copy[locale] = first.trim();
      }
    }
  }

  for (const locale of SUPPORTED_LOCALES) {
    if (!copy[locale]) copy[locale] = fallback;
  }
  return copy;
};

const writtenLocales = (value: unknown): LocaleString[] => {
  if (typeof value === "string") return value.trim() ? [FALLBACK_LOCALE] : [];
  if (!value || typeof value !== "object") return [];
  const localized = value as Record<string, unknown>;
  return SUPPORTED_LOCALES.filter((locale) => {
    const text = localized[locale];
    return typeof text === "string" && text.trim().length > 0;
  });
};

const emptyList = (): LocalizedList =>
  Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, [] as string[]])) as LocalizedList;


const stringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => (typeof item === "string" && item.trim() ? [item.trim()] : []));
};

const localizedList = (value: unknown): LocalizedList => {
  const list = emptyList();
  if (!value || typeof value !== "object" || Array.isArray(value)) return list;
  const localized = value as Record<string, unknown>;
  for (const locale of SUPPORTED_LOCALES) {
    list[locale] = stringList(localized[locale]);
  }
  const first = Object.values(localized).map(stringList).find((items) => items.length > 0) ?? [];
  for (const locale of SUPPORTED_LOCALES) {
    if (list[locale].length === 0) list[locale] = first;
  }
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
        presence: {
          slug,
          name,
          category: typeof item.category === "string" && isLibraryCategory(item.category)
            ? item.category
            : "other",
          color: typeof item.color === "string" && item.color.trim() ? item.color.trim() : "#111111",
          description,
          longDescription: localizedCopy(item.longDescription, description[FALLBACK_LOCALE]),
          features: localizedList(item.features),
          urls: parseUrls(item.url),
          author: parsePerson(item.author, name),
          contributors: parsePeople(item.contributors, name),
          version: typeof item.version === "string" && item.version.trim() ? item.version.trim() : null,
          discordNative: item.discordNative === true,
          locales: writtenLocales(item.description),
        },
        totalInstalls: typeof item.totalInstalls === "number" ? item.totalInstalls : 0,
      }];
    })
    .toSorted((a, b) => b.totalInstalls - a.totalInstalls || a.presence.name.localeCompare(b.presence.name))
    .map(({ presence }) => presence);
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

export type PresenceVersionNote = {
  version: string
  note: LocalizedCopy
  date: string | null
  commit: PresenceCommit | null
};

const toCommit = (sha: string): PresenceCommit | null => {
  if (!COMMIT_SHA.test(sha)) return null;
  return {
    sha,
    shortSha: sha.slice(0, 7),
    href: `${PRESENCES_REPOSITORY_URL}/commit/${sha}`,
  };
};

const parseChangelogField = (value: unknown): LocalizedCopy => {
  if (typeof value === "string" && value.trim()) {
    try {
      return localizedCopy(JSON.parse(value), "");
    } catch {
      return localizedCopy(value, "");
    }
  }
  return localizedCopy(value, "");
};

const versionDate = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  const day = value.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
};

export const getPresenceVersionHistory = cache(async (slug: string): Promise<PresenceVersionNote[]> => {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return [];

  try {
    const response = await fetch(
      `${PRODUCTION_API_URL}/presences/${encodeURIComponent(normalized)}/versions`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) return [];
    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];

    return data.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const entry = row as { version?: unknown; changelog?: unknown; createdAt?: unknown; commitSha?: unknown };
      const version = typeof entry.version === "string" ? entry.version.trim() : "";
      if (!version) return [];
      const sha = typeof entry.commitSha === "string" ? entry.commitSha.trim() : "";
      return [{
        version,
        note: parseChangelogField(entry.changelog),
        date: versionDate(entry.createdAt),
        commit: toCommit(sha),
      }];
    });
  } catch {
    return [];
  }
});
export type PresenceStats = {
  totalInstalls: number
  activeUsers: number
  likes: number
};

export const getPresenceStats = cache(async (slug: string): Promise<PresenceStats> => {
  const normalized = slug.trim().toLowerCase();
  const fallback: PresenceStats = { totalInstalls: 0, activeUsers: 0, likes: 0 };
  if (!normalized) return fallback;

  try {
    const response = await fetch(
      `${presenceApiBaseUrl()}/presences/${encodeURIComponent(normalized)}/stats`,
      { next: { revalidate: 60 } },
    );
    if (!response.ok) return fallback;
    const data = await response.json() as Partial<PresenceStats>;
    return {
      totalInstalls: typeof data.totalInstalls === "number" ? data.totalInstalls : 0,
      activeUsers: typeof data.activeUsers === "number" ? data.activeUsers : 0,
      likes: typeof data.likes === "number" ? data.likes : 0,
    };
  } catch {
    return fallback;
  }
});
