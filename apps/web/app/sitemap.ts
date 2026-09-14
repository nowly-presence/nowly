import { DOCS_URL, SITE_URL } from "@/lib/seo";
import { buildPresenceSeoPath } from "@/lib/seo-presence";
import { clientEnv } from "@nowly/env/client";
import type { MetadataRoute } from "next";

type PresenceSitemapItem = {
  slug?: string
  lastUpdated?: string
  addedAt?: string
  author?: { github?: string }
  contributors?: Array<{ github?: string }>
};

const fetchPresencePages = async (): Promise<MetadataRoute.Sitemap> => {
  try {
    const res = await fetch(`${clientEnv.NEXT_PUBLIC_API_BASE_URL}/presences`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const presences = await res.json() as PresenceSitemapItem[];
    const authors = new Set<string>();

    const validPresences = presences
      .filter((presence): presence is PresenceSitemapItem & { slug: string } => Boolean(presence.slug))
      .flatMap((presence) => {
        const lastModified = presence.lastUpdated ?? presence.addedAt ?? new Date();
        const handles = [presence.author?.github, ...(presence.contributors ?? []).map((item) => item.github)]
          .map((handle) => handle?.replace(/^@/, "").toLowerCase())
          .filter((handle): handle is string => Boolean(handle));
        for (const handle of handles) authors.add(handle);

        return [
          {
            url: `${SITE_URL}${buildPresenceSeoPath(presence.slug)}`,
            lastModified,
            changeFrequency: "weekly" as const,
            priority: 0.95,
          },
        ];
      });

    const authorPages = [...authors].map((github) => ({
      url: `${SITE_URL}/author/${github}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.55,
    }));

    return [...validPresences, ...authorPages];
  } catch {
    return [];
  }
};

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
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
      url: `${DOCS_URL}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
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
      url: `${SITE_URL}/team`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/support`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/support/redeem`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/consent`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.45,
    },
    {
      url: `${SITE_URL}/cookies`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/legal-notice`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
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

  return [...pages, ...await fetchPresencePages()];
};

export default sitemap;