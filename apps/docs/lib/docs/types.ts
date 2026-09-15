import type { LocalizedValue } from "@nowly/locales";

export type DocSection = {
  slug: string;
  order: number;
  title: LocalizedValue<string>;
  path: string;
  children: DocSection[];
};

export type DocNavigationItem = {
  slug: string;
  title: string;
  description: string;
  order: number;
  path: string;
  children: DocNavigationItem[];
};

export type DocContent = {
  slug: string;
  path: string;
  sourcePath: string;
  title: string;
  description: string;
  content: string;
  frontmatter: Record<string, unknown>;
};

export type TocItem = {
  id: string;
  text: string;
  level: number;
};

const htmlEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: "\"",
};

export const normalizeHeadingText = (value: string): string =>
  value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, name: string) => {
      const normalizedName = name.toLowerCase();
      if (normalizedName.startsWith("#x")) {
        return String.fromCodePoint(Number.parseInt(normalizedName.slice(2), 16));
      }
      if (normalizedName.startsWith("#")) {
        return String.fromCodePoint(Number.parseInt(normalizedName.slice(1), 10));
      }
      return htmlEntities[normalizedName] ?? entity;
    })
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const createHeadingId = (value: string): string =>
  normalizeHeadingText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const extractTocItems = (content: string): TocItem[] => {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = normalizeHeadingText(match[2]);
    const id = createHeadingId(text);

    items.push({ id, text, level });
  }

  return items;
};