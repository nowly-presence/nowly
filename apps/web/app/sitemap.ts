import { CHANGELOG_RELEASES } from "@/lib/changelog-releases";
import { catalogGithubHandles } from "@/lib/library-catalog";
import { getPresenceCatalog } from "@/lib/presence-api";
import { DOCS_ORIGIN, isSeoPreview, seoUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";

const entry = (
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
  lastModified?: Date,
): MetadataRoute.Sitemap[number] => ({
  url: path.startsWith("http") ? path : seoUrl(path),
  lastModified: lastModified ?? new Date(),
  changeFrequency,
  priority,
});

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  if (isSeoPreview) return [];

  const catalog = await getPresenceCatalog().catch(() => []);
  const authors = catalogGithubHandles(catalog);

  return [
    entry("/", "weekly", 1),
    entry("/library", "weekly", 0.9),
    {
      url: `${DOCS_ORIGIN}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    entry("/desktop", "monthly", 0.7),
    entry("/extension", "monthly", 0.7),
    entry("/canary", "weekly", 0.55),
    entry("/changelog", "monthly", 0.6),
    ...CHANGELOG_RELEASES.map((release) =>
      entry(
        `/changelog/${release.version}`,
        "monthly",
        0.5,
        release.date ? new Date(release.date) : undefined,
      ),
    ),
    entry("/support", "monthly", 0.6),
    ...catalog.map((presence) => entry(`/library/${presence.slug}`, "weekly", 0.75)),
    ...authors.map((github) => entry(`/author/${github}`, "weekly", 0.45)),
    entry("/privacy", "yearly", 0.3),
    entry("/consent", "yearly", 0.3),
    entry("/tos", "yearly", 0.3),
    entry("/cookies", "yearly", 0.3),
    entry("/legal-notice", "yearly", 0.3),
  ];
};

export default sitemap;
