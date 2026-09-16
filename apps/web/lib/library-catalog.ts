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

export type LibraryPresence = {
  slug: string
  name: string
  category: LibraryCategory
  color: string
  description: LocalizedCopy
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

export const presenceSearchText = (presence: LibraryPresence): string =>
  [
    presence.name,
    presence.slug,
    presence.category,
    presence.description["en-US"],
    presence.description["fr-FR"],
    presence.description["es-ES"],
  ]
    .join(" ")
    .toLowerCase();
