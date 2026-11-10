import type { TocItem } from "./types";

type HtmlNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HtmlNode[];
};

const headingText = (node: HtmlNode): string => {
  if (node.type === "text") return node.value ?? "";
  if (node.tagName === "img" && typeof node.properties?.alt === "string") return node.properties.alt;

  return node.children?.map(headingText).join("") ?? "";
};

const headingSlug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "section";

export const createDocHeadings = () => {
  const items: TocItem[] = [];
  const ids = new Set<string>();

  const visit = (node: HtmlNode): void => {
    if (node.type === "element" && node.tagName && /^h[1-4]$/.test(node.tagName)) {
      const level = Number(node.tagName[1]);
      const text = headingText(node).replace(/\s+/g, " ").trim();
      const baseId = headingSlug(text);
      let id = baseId;
      let suffix = 2;

      while (ids.has(id)) {
        id = `${baseId}-${suffix++}`;
      }

      ids.add(id);
      node.properties = {
        ...node.properties,
        id,
        dataHeadingText: text || id
      };

      if (level === 2 || level === 3) items.push({ id, text, level });
    }

    node.children?.forEach(visit);
  };

  return {
    items,
    rehypePlugin: () => visit
  };
};