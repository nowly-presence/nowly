import { getContentEntry, type ContentEntry } from "@/features/content/lib/content-files";

// No presence guide is published unless its Markdown folder exists under content/presences.
// Copy the archived folder back to republish the original articles.
export const getPresenceGuide = (slug: string, locale: string): ContentEntry | null =>
  getContentEntry("presences", slug, locale);
