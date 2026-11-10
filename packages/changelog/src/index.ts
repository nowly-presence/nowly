import matter from "gray-matter";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CONTENT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "content");

export type ChangelogStore = "chrome" | "firefox";

export type ChangelogFrontmatter = {
  title: string;
  date: string | null;
  description: string;
  banner?: string;
  stores?: ChangelogStore[];
};

export type ChangelogEntry = ChangelogFrontmatter & {
  slug: string;
  version: string;
};

type ParsedSlug = {
  raw: string;
  parts: [number, number, number, number];
};

// A 4th segment covers store-specific patch resubmissions (e.g. a Firefox-only
// AMO resubmission like 2.1.0.1) that never got a matching Chrome release.
const parseSlug = (name: string): ParsedSlug | null => {
  const match = /^(\d+)-(\d+)-(\d+)(?:-(\d+))?$/.exec(name);

  if (!match) return null;

  return {
    raw: name,
    parts: [
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      Number(match[4] ?? 0)
    ]
  };
};

const compareDesc = (a: ParsedSlug, b: ParsedSlug): number =>
  b.parts[0] - a.parts[0] || b.parts[1] - a.parts[1] || b.parts[2] - a.parts[2] || b.parts[3] - a.parts[3];

export const getChangelogSlugs = (): string[] => {
  if (!existsSync(CONTENT_ROOT)) return [];

  return readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => parseSlug(entry.name))
    .filter((slug): slug is ParsedSlug => slug !== null)
    .sort(compareDesc)
    .map((slug) => slug.raw);
};

export const getChangelogLocales = (slug: string): string[] => {
  const dir = join(CONTENT_ROOT, slug);

  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
};

const readLocale = (slug: string, locale: string) => {
  const path = join(CONTENT_ROOT, slug, `${locale}.mdx`);
  return existsSync(path) ? matter(readFileSync(path, "utf-8")) : null;
};

// js-yaml parses an unquoted `date: 2026-09-17` into a Date, not a string.
const toDateString = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  return null;
};

const isChangelogStore = (value: unknown): value is ChangelogStore => value === "chrome" || value === "firefox";

const toFrontmatter = (data: Record<string, unknown>, fallbackTitle: string, date: unknown): ChangelogFrontmatter => ({
  title: typeof data.title === "string" ? data.title : fallbackTitle,
  date: toDateString(date),
  description: typeof data.description === "string" ? data.description : "",
  banner: typeof data.banner === "string" ? data.banner : undefined,
  stores: Array.isArray(data.stores) ? data.stores.filter(isChangelogStore) : undefined
});

export const getChangelogBody = (slug: string, locale: string): {
  frontmatter: ChangelogFrontmatter;
  content: string;
} | null => {
  const source = readLocale(slug, "en-US");
  const file = (locale === "en-US" ? source : readLocale(slug, locale)) ?? source;

  if (!file) return null;

  // Translations may carry human-readable dates. Publication uses the English release date when that file exists.
  return {
    frontmatter: toFrontmatter(file.data, slug.replace(/-/g, "."), (source ?? file).data.date),
    content: file.content
  };
};

export const getChangelogFrontmatter = (slug: string, locale: string): ChangelogFrontmatter | null => getChangelogBody(slug, locale)?.frontmatter ?? null;

export const getChangelogList = (locale: string): ChangelogEntry[] =>
  getChangelogSlugs().flatMap((slug) => {
    const frontmatter = getChangelogFrontmatter(slug, locale);

    if (!frontmatter) return [];

    return [
      {
        slug,
        version: slug.replace(/-/g, "."),
        ...frontmatter
      }
    ];
  });

export const parseChangelogVersion = (value: string): {
  version: string;
  slug: string;
} | null => {
  const match = /^v?(\d+)[.-](\d+)[.-](\d+)(?:[.-](\d+))?$/i.exec(value.trim());

  if (!match) return null;

  const parts = [match[1], match[2], match[3], match[4]].filter((part): part is string => Boolean(part));
  return {
    version: parts.join("."),
    slug: parts.join("-")
  };
};

export const getChangelogEntry = (versionOrSlug: string, locale: string): ChangelogEntry | null => {
  const parsed = parseChangelogVersion(versionOrSlug);
  const slug = parsed?.slug ?? versionOrSlug;
  const frontmatter = getChangelogFrontmatter(slug, locale);
  return frontmatter ? { slug, version: parsed?.version ?? slug.replace(/-/g, "."), ...frontmatter } : null;
};