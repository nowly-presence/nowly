import { getNavigationItems } from "@/lib/docs/content";
import { DOCS_URL } from "@/lib/constants";
import type { MetadataRoute } from "next";

const sitemap = (): MetadataRoute.Sitemap => {
  const docs = getNavigationItems("en-US");
  const docPages = docs.flatMap((section) => {
    const pages = section.children.map((page) => ({
      url: `${DOCS_URL}/${page.path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: section.slug === "changelog" ? 0.65 : 0.8,
    }));

    return section.slug === "changelog"
      ? [
          {
            url: `${DOCS_URL}/changelog`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.7,
          },
          ...pages,
        ]
      : pages;
  });

  return [
    {
      url: `${DOCS_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...docPages,
  ];
};

export default sitemap;
