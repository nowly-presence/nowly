import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { DOCS_URL, isSeoPreview } from "@/lib/constants";
import { getNavigationItems } from "@/features/docs-content/lib/content";
import type { MetadataRoute } from "next";

const absoluteUrl = (locale: string, href: string): string => `${DOCS_URL}${getPathname({ locale, href })}`;

const languageAlternates = (href: string): Record<string, string> =>
  Object.fromEntries(routing.locales.map((locale) => [locale, absoluteUrl(locale, href)]));

type DocPath = {
  href: string
  changeFrequency: "monthly"
  priority: number
};

const sitemap = (): MetadataRoute.Sitemap => {
  if (isSeoPreview) return [];

  const docs = getNavigationItems("en-US");
  const paths: DocPath[] = [];

  for (const section of docs) {
    if (section.slug === "changelog") {
      paths.push({ href: "/changelog", changeFrequency: "monthly", priority: 0.7 });
    }

    for (const page of section.children) {
      paths.push({
        href: `/${page.path}`,
        changeFrequency: "monthly",
        priority: section.slug === "changelog" ? 0.65 : 0.8,
      });
    }
  }

  return routing.locales.flatMap((locale) =>
    paths.map(({ href, changeFrequency, priority }) => ({
      url: absoluteUrl(locale, href),
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: { languages: languageAlternates(href) },
    })),
  );
};

export default sitemap;
