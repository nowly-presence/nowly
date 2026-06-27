import { FALLBACK_LOCALE } from "@nowly/locales";
import type { Metadata } from "@nowly/sdk/metadata";
import type { Contributor, Presence, PresenceCategory } from "./presences";
import { CATEGORIES } from "./categories";

type ContributorInput = {
  name?: string;
  github?: string;
  avatar?: string;
};

type MetadataWithStats = Metadata & {
  totalInstalls?: number
  activeUsers?: number
};

const toContributor = (c: ContributorInput | undefined, fallbackName: string): Contributor => {
  const name = c?.name?.trim() || c?.github || fallbackName;

  return {
    name,
    github: c?.github,
    avatar: c?.github ? `https://github.com/${c.github}.png` : undefined,
  };
};

const DEFAULT_CATEGORY: PresenceCategory = "other";

const toPresenceCategory = (category: Metadata["category"] | undefined): PresenceCategory =>
  CATEGORIES.includes(category as PresenceCategory) ? category as PresenceCategory : DEFAULT_CATEGORY;

export const metadataToPlatform = (m: MetadataWithStats): Presence => {
  const slug = m.slug ?? m.name.toLowerCase().replace(/\s+/g, "-");
  const desc = m.description?.[FALLBACK_LOCALE] ?? "";
  return {
    id: slug,
    slug,
    name: m.name,
    description: desc,
    longDescription: m.longDescription?.[FALLBACK_LOCALE] ?? desc,
    icon: slug,
    iconColor: m.color,
    category: toPresenceCategory(m.category),
    status: "available",
    version: m.version ?? null,
    activeUsers: m.activeUsers ?? 0,
    totalInstalls: m.totalInstalls ?? 0,
    addedAt: "2024-01-01",
    lastUpdated: new Date().toISOString().split("T")[0],
    supportedUrls: m.url,
    author: toContributor(m.author, m.name),
    contributors: (m.contributors ?? []).map((contributor) => toContributor(contributor, m.name)),
    features: m.features?.[FALLBACK_LOCALE] ?? [],
    settings: m.settings ?? undefined,
    localized: {
      description: m.description as Record<string, string>,
      longDescription: m.longDescription as Record<string, string> | undefined,
      features: m.features,
    },
  };
};
