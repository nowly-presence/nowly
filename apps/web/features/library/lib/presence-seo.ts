import type { LibraryPresence } from "@/lib/library-catalog";

const searchTerms = ["Rich Presence", "Rich Presence Discord", "Discord Rich Presence", "Discord RPC"];

export const presenceSeoKeywords = (presence: Pick<LibraryPresence, "name" | "aliases">): string[] => {
  const names = new Map<string, string>();

  for (const value of [presence.name, ...presence.aliases]) {
    const name = value.trim().replace(/\s+/g, " ");
    const key = name.toLowerCase();

    if (name && !names.has(key)) names.set(key, name);
  }

  return [...names.values()].flatMap((name) => searchTerms.map((term) => `${name} ${term}`));
};