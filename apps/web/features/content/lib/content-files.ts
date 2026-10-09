import { FALLBACK_LOCALE, getValidLocale, type LocaleString } from "@nowly/locales";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

import {
  frenchSpacing,
  mapBlockText,
  markdownHeadings,
  markdownWordCount,
  parseMarkdown,
  type Block,
  type Heading,
} from "@/features/content/lib/markdown";
import { parseFrontmatter, type ContentMeta } from "@/features/content/lib/frontmatter";

export type ContentCollection = "guides" | "presences";

export type ContentEntry = {
  collection: ContentCollection
  slug: string
  // The locale the text is written in: the requested one, or en-US when it has no translation.
  locale: LocaleString
  translated: boolean
  locales: LocaleString[]
  meta: ContentMeta
  blocks: Block[]
  headings: Heading[]
  words: number
};

const CONTENT_ROOT = join(process.cwd(), "content");
const WORDS_PER_MINUTE = 220;

const collectionPath = (collection: ContentCollection): string => join(CONTENT_ROOT, collection);

export const readingMinutes = (words: number): number => Math.max(1, Math.round(words / WORDS_PER_MINUTE));

export const contentLocales = cache((collection: ContentCollection, slug: string): LocaleString[] => {
  const folder = join(collectionPath(collection), slug);
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.slice(0, -".md".length))
    .filter((locale): locale is LocaleString => getValidLocale(locale) === locale);
});

export const contentSlugs = cache((collection: ContentCollection): string[] => {
  const root = collectionPath(collection);
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && contentLocales(collection, entry.name).length > 0)
    .map((entry) => entry.name)
    .sort();
});

export const getContentEntry = cache((collection: ContentCollection, slug: string, requested: string): ContentEntry | null => {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const locales = contentLocales(collection, slug);
  if (locales.length === 0) return null;
  const wanted = getValidLocale(requested);
  const locale = locales.includes(wanted) ? wanted : locales.includes(FALLBACK_LOCALE) ? FALLBACK_LOCALE : locales[0];
  const { meta: rawMeta, body } = parseFrontmatter(readFileSync(join(collectionPath(collection), slug, `${locale}.md`), "utf-8"));
  const french = locale === "fr-FR";
  const meta = french ? Object.fromEntries(Object.entries(rawMeta).map(([key, value]) => [key, frenchSpacing(value)])) : rawMeta;
  const blocks = french ? mapBlockText(parseMarkdown(body), frenchSpacing) : parseMarkdown(body);
  return {
    collection,
    slug,
    locale,
    translated: locale === wanted,
    locales,
    meta,
    blocks,
    headings: markdownHeadings(blocks),
    words: markdownWordCount(blocks),
  };
});

export const getContentEntries = cache((collection: ContentCollection, requested: string): ContentEntry[] =>
  contentSlugs(collection)
    .map((slug) => getContentEntry(collection, slug, requested))
    .filter((entry): entry is ContentEntry => entry !== null),
);
