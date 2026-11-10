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