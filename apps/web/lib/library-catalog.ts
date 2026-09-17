import { presenceLogoUrl, presenceThumbnailUrl } from "@/lib/presence-api";

export const LIBRARY_CATEGORIES = [
  "streaming",
  "music",
  "video",
  "gaming",
  "social",
  "ai",
  "tools",
  "learning",
  "other",
] as const;

export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number];

export type LocalizedCopy = {
  "en-US": string
  "fr-FR": string
  "es-ES": string
};

export type LocalizedList = {
  "en-US": string[]
  "fr-FR": string[]
  "es-ES": string[]
};

export type PresencePerson = {
  name: string
  github?: string
};

export type LibraryPresence = {
  slug: string
  name: string
  category: LibraryCategory
  color: string
  description: LocalizedCopy
  longDescription: LocalizedCopy
  features: LocalizedList
  urls: string[]
  author: PresencePerson
  contributors: PresencePerson[]
  version: string | null
  discordNative: boolean
};

export const libraryLogoUrl = (slug: string): string => presenceLogoUrl(slug);

export const libraryThumbnailUrl = (slug: string): string => presenceThumbnailUrl(slug);

export const isLibraryCategory = (value: string): value is LibraryCategory =>
  LIBRARY_CATEGORIES.includes(value as LibraryCategory);

export const catalogCategories = (items: LibraryPresence[]): LibraryCategory[] =>
  LIBRARY_CATEGORIES.filter((category) =>
    items.some((presence) => presence.category === category),
  );

export const localizedDescription = (
  presence: LibraryPresence,
  locale: string,
): string =>
  presence.description[locale as keyof LocalizedCopy] ?? presence.description["en-US"];

export const localizedLongDescription = (
  presence: LibraryPresence,
  locale: string,
): string =>
  presence.longDescription[locale as keyof LocalizedCopy] ??
  presence.longDescription["en-US"] ??
  localizedDescription(presence, locale);

export const localizedFeatures = (
  presence: LibraryPresence,
  locale: string,
): string[] => {
  const features = presence.features[locale as keyof LocalizedList];
  if (features.length > 0) return features;
  return presence.features["en-US"];
};

export const presenceSearchText = (presence: LibraryPresence): string =>
  [
    presence.name,
    presence.slug,
    presence.category,
    presence.author.name,
    presence.author.github ?? "",
    ...presence.contributors.flatMap((person) => [person.name, person.github ?? ""]),
    ...presence.urls,
    presence.description["en-US"],
    presence.description["fr-FR"],
    presence.description["es-ES"],
    presence.longDescription["en-US"],
    presence.longDescription["fr-FR"],
    presence.longDescription["es-ES"],
  ]
    .join(" ")
    .toLowerCase();

export const relatedPresences = (
  items: LibraryPresence[],
  current: LibraryPresence,
  limit = 3,
): LibraryPresence[] => {
  const others = items.filter((presence) => presence.slug !== current.slug);
  const sameCategory = others.filter((presence) => presence.category === current.category);
  const rest = others.filter((presence) => presence.category !== current.category);
  return [...sameCategory, ...rest].slice(0, limit);
};

export const presenceSiteHref = (url: string): string =>
  url.includes("://") ? url : `https://${url}`;

export const normalizeGithub = (value: string): string =>
  value.trim().replace(/^@/, "").toLowerCase();

export const personMatchesGithub = (person: PresencePerson, handle: string): boolean =>
  Boolean(person.github && normalizeGithub(person.github) === handle);

export const presenceMatchesGithub = (presence: LibraryPresence, handle: string): boolean => {
  const normalized = normalizeGithub(handle);
  if (!normalized) return false;
  return personMatchesGithub(presence.author, normalized)
    || presence.contributors.some((person) => personMatchesGithub(person, normalized));
};

export const contributorDisplayName = (presence: LibraryPresence, handle: string): string => {
  const normalized = normalizeGithub(handle);
  const match = [presence.author, ...presence.contributors]
    .find((person) => personMatchesGithub(person, normalized));
  return match?.name ?? handle;
};

export const catalogGithubHandles = (items: LibraryPresence[]): string[] => {
  const handles = new Set<string>();
  for (const presence of items) {
    for (const person of [presence.author, ...presence.contributors]) {
      if (person.github) handles.add(normalizeGithub(person.github));
    }
  }
  return [...handles];
};

export const authorHref = (github: string): string =>
  `/author/${encodeURIComponent(normalizeGithub(github))}`;
