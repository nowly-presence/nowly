import { getValidLocale } from "@nowly/locales";
import matter from "gray-matter";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CHANGELOG_ROOT = join(process.cwd(), "../docs/content/docs/changelog");

export type ChangelogDoc = {
  title: string
  description: string
  content: string
};

export type PublicChangelogVersion = {
  publicVersion: string
  docSlug: string
};

export const parsePublicChangelogVersion = (value: string): PublicChangelogVersion | null => {
  const match = /^(\d+)[.-](\d+)[.-](\d+)$/.exec(value.trim().replace(/^v/i, ""));

  if (!match) return null;

  return {
    publicVersion: `${match[1]}.${match[2]}.${match[3]}`,
    docSlug: `${match[1]}-${match[2]}-${match[3]}`,
  };
};

export const getChangelogVersions = (): PublicChangelogVersion[] => {
  if (!existsSync(CHANGELOG_ROOT)) return [];

  return readdirSync(CHANGELOG_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const parsed = parsePublicChangelogVersion(entry.name);
      return parsed ? [parsed] : [];
    });
};

export const getChangelogDoc = (docSlug: string, locale: string): ChangelogDoc | null => {
  const validLocale = getValidLocale(locale);
  const localizedPath = join(CHANGELOG_ROOT, docSlug, `${validLocale}.mdx`);
  const fallbackPath = join(CHANGELOG_ROOT, docSlug, "en-US.mdx");
  const filePath = existsSync(localizedPath) ? localizedPath : existsSync(fallbackPath) ? fallbackPath : null;

  if (!filePath) return null;

  const { data, content } = matter(readFileSync(filePath, "utf-8"));
  const fallbackTitle = docSlug.replace(/-/g, ".");

  return {
    title: typeof data.title === "string" ? data.title : fallbackTitle,
    description: typeof data.description === "string" ? data.description : "",
    content,
  };
};
