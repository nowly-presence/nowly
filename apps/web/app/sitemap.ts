import { getNavigationItems } from "@/lib/docs/content";
import { SITE_URL } from "@/lib/seo";
import { buildPresenceSeoPath } from "@/lib/seo-presence";
import { clientEnv } from "@nowly/env/client";
import type { MetadataRoute } from "next";

type PresenceSitemapItem = {
  slug?: string
  lastUpdated?: string
  addedAt?: string
};

const fetchPresencePages = async (): Promise<MetadataRoute.Sitemap> => {
  try {
    const res = await fetch(`${clientEnv.NEXT_PUBLIC_API_BASE_URL}/presences`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const presences = await res.json() as PresenceSitemapItem[];

    const validPresences = presences
      .filter((presence): presence is PresenceSitemapItem & { slug: string } => Boolean(presence.slug))
      .flatMap((presence) => {
        const lastModified = presence.lastUpdated ?? presence.addedAt ?? new Date();

        return [
          {
            url: `${SITE_URL}/library/${presence.slug}`,
            lastModified,
            changeFrequency: "weekly" as const,
            priority: 0.85,
          },
          {
            url: `${SITE_URL}${buildPresenceSeoPath(presence.slug)}`,
            lastModified,
            changeFrequency: "weekly" as const,
            priority: 0.95,
          },
        ];
      });

    return validPresences;
  } catch {
    return [];
  }
};

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const docs = getNavigationItems("en-US");
  const docPages = docs.flatMap((section) => {
    const pages = section.children.map((page) => ({
      url: `${SITE_URL}/docs/${page.path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: section.slug === "changelog" ? 0.65 : 0.7,
    }));

    return section.slug === "changelog"
      ? [
          {
            url: `${SITE_URL}/docs/changelog`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.7,
          },
          ...pages,
        ]
      : pages;
  });

  const pages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/library`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/host`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/status`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.65,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/data-collected`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/tos`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  return [...pages, ...docPages, ...await fetchPresencePages()];
};

export default sitemap;