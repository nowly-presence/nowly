import { CHANGELOG_RELEASES } from "@/lib/changelog-releases";
import { DOCS_URL, SITE_URL } from "@/lib/seo";
import type { MetadataRoute } from "next";

const sitemap = (): MetadataRoute.Sitemap => [
  { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  { url: `${SITE_URL}/library`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  { url: `${DOCS_URL}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
  { url: `${SITE_URL}/desktop`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE_URL}/changelog`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ...CHANGELOG_RELEASES.map((release) => ({
    url: `${SITE_URL}/changelog/${release.version}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  })),
  { url: `${SITE_URL}/support`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
  { url: `${SITE_URL}/tos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
  { url: `${SITE_URL}/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
  { url: `${SITE_URL}/legal-notice`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
];

export default sitemap;
