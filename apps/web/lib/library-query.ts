import { CATEGORIES, type PresenceCategory } from "@/lib/data/categories";
import type { Presence } from "@/lib/data/presences";

export type LibrarySort = "name-asc" | "name-desc" | "popular" | "recent";

export const LIBRARY_SORTS: LibrarySort[] = ["popular", "recent", "name-asc", "name-desc"];

export const normalizeGithub = (value: string | undefined): string =>
  (value ?? "").trim().replace(/^@/, "").toLowerCase();

export const presenceMatchesGithub = (presence: Presence, github: string): boolean => {
  const handle = normalizeGithub(github);
  if (!handle) return false;
  if (normalizeGithub(presence.author.github) === handle) return true;
  return presence.contributors.some((contributor) => normalizeGithub(contributor.github) === handle);
};

export const contributorDisplayName = (presence: Presence, github: string): string => {
  const handle = normalizeGithub(github);
  if (normalizeGithub(presence.author.github) === handle) return presence.author.name;
  const contributor = presence.contributors.find((item) => normalizeGithub(item.github) === handle);
  return contributor?.name || github;
};

export const uniqueGithubAuthors = (presences: Presence[]): { github: string; name: string }[] => {
  const byHandle = new Map<string, string>();
  for (const presence of presences) {
    const people = [presence.author, ...presence.contributors];
    for (const person of people) {
      const github = normalizeGithub(person.github);
      if (!github || byHandle.has(github)) continue;
      byHandle.set(github, person.name);
    }
  }
  return [...byHandle.entries()]
    .map(([github, name]) => ({ github, name }))
    .toSorted((a, b) => a.name.localeCompare(b.name));
};

export const parseLibraryCategories = (value: string | null): PresenceCategory[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is PresenceCategory => CATEGORIES.includes(item as PresenceCategory));
};

export const parseLibrarySort = (value: string | null): LibrarySort =>
  LIBRARY_SORTS.includes(value as LibrarySort) ? (value as LibrarySort) : "popular";
