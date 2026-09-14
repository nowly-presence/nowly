import { getValidLocale } from "@nowly/locales";
import matter from "gray-matter";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getDocsNav } from "./content";

type DocOgMetadata = {
  title: string
  description: string
  category: string
};

const getLocalizedTitle = (title: Record<string, string>, locale: string, fallback: string): string => {
  return title[locale] ?? title["en-US"] ?? fallback;
};

const readDocFile = (pagePath: string, locale: string): { raw: string } | null => {
  const validLocale = getValidLocale(locale);
  const localizedPath = join(pagePath, `${validLocale}.mdx`);
  const fallbackPath = join(pagePath, "en-US.mdx");

  if (existsSync(localizedPath)) {
    return { raw: readFileSync(localizedPath, "utf-8") };
  }

  if (existsSync(fallbackPath)) {
    return { raw: readFileSync(fallbackPath, "utf-8") };
  }

  return null;
};

export const getDocOgMetadata = (slug: string, locale: string = "en-US"): DocOgMetadata | null => {
  const validLocale = getValidLocale(locale);

  for (const category of getDocsNav()) {
    const page = category.children.find((child) => child.slug === slug);
    if (!page) continue;

    const docFile = readDocFile(page.path, validLocale);
    if (!docFile) return null;

    const { data } = matter(docFile.raw);

    return {
      title: typeof data.title === "string" ? data.title : page.slug,
      description: typeof data.description === "string" ? data.description : "",
      category: getLocalizedTitle(category.title, validLocale, category.slug),
    };
  }

  return null;
};