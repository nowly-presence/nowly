export type Inline =
  | { kind: "text"; text: string }
  | { kind: "strong"; children: Inline[] }
  | { kind: "code"; text: string }
  | { kind: "link"; href: string; children: Inline[] };

export type Block =
  | { kind: "heading"; level: 2 | 3; id: string; text: string; children: Inline[] }
  | { kind: "paragraph"; children: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "note"; children: Inline[][] }
  | { kind: "code"; text: string }
  | { kind: "table"; head: Inline[][]; rows: Inline[][][] };

export type Heading = { id: string; text: string; level: 2 | 3 };

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/;

export const parseInline = (source: string): Inline[] => {
  const nodes: Inline[] = [];
  for (const part of source.split(INLINE_PATTERN)) {
    if (!part) continue;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      nodes.push({ kind: "strong", children: parseInline(part.slice(2, -2)) });
    } else if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      nodes.push({ kind: "code", text: part.slice(1, -1) });
    } else {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
      if (link) nodes.push({ kind: "link", href: link[2], children: parseInline(link[1]) });
      else nodes.push({ kind: "text", text: part });
    }
  }
  return nodes;
};

export const inlineText = (nodes: Inline[]): string =>
  nodes.map((node) => (node.kind === "text" || node.kind === "code" ? node.text : inlineText(node.children))).join("");

export const slugifyHeading = (text: string): string =>
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "section";

const LIST_ITEM = /^(\s*)([-*]|\d+\.)\s+(.*)$/;
const TABLE_DIVIDER = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/;

const splitRow = (line: string): string[] =>
  line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());

const isBlockStart = (line: string): boolean =>
  /^#{2,3}\s/.test(line) || LIST_ITEM.test(line) || line.startsWith(">") || line.startsWith("```") || line.trim().startsWith("|");

// Parses the small Markdown subset used by content/ and packages/changelog: ## and ### headings,
// paragraphs, - and 1. lists (one level), > notes, ``` code blocks, pipe tables, **bold**, `code`
// and [links](href). MDX components and anything else unknown are skipped, never rendered as HTML.
export const parseMarkdown = (source: string): Block[] => {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  const usedIds = new Map<string, number>();
  let index = 0;

  const uniqueId = (text: string): string => {
    const base = slugifyHeading(text);
    const count = usedIds.get(base) ?? 0;
    usedIds.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const heading = /^(#{2,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      const text = heading[2].trim();
      blocks.push({
        kind: "heading",
        level: heading[1].length === 2 ? 2 : 3,
        id: uniqueId(inlineText(parseInline(text))),
        text: inlineText(parseInline(text)),
        children: parseInline(text),
      });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        body.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push({ kind: "code", text: body.join("\n") });
      continue;
    }

    if (trimmed.startsWith(">")) {
      const paragraphs: string[][] = [[]];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        const content = lines[index].trim().replace(/^>\s?/, "");
        if (content) paragraphs[paragraphs.length - 1].push(content);
        else if (paragraphs[paragraphs.length - 1].length > 0) paragraphs.push([]);
        index += 1;
      }
      blocks.push({
        kind: "note",
        children: paragraphs.filter((part) => part.length > 0).map((part) => parseInline(part.join(" "))),
      });
      continue;
    }

    if (trimmed.startsWith("|") && index + 1 < lines.length && TABLE_DIVIDER.test(lines[index + 1].trim())) {
      const head = splitRow(trimmed).map(parseInline);
      const rows: Inline[][][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(splitRow(lines[index]).map(parseInline));
        index += 1;
      }
      blocks.push({ kind: "table", head, rows });
      continue;
    }

    const item = LIST_ITEM.exec(line);
    if (item) {
      const ordered = /\d/.test(item[2]);
      const items: string[] = [];
      while (index < lines.length) {
        const current = LIST_ITEM.exec(lines[index]);
        if (current && /\d/.test(current[2]) === ordered) {
          items.push(current[3].trim());
          index += 1;
          continue;
        }
        const continuation = lines[index];
        if (continuation.trim() && /^\s{2,}/.test(continuation) && items.length > 0 && !isBlockStart(continuation.trim())) {
          items[items.length - 1] += ` ${continuation.trim()}`;
          index += 1;
          continue;
        }
        break;
      }
      blocks.push({ kind: "list", ordered, items: items.map(parseInline) });
      continue;
    }

    if (trimmed.startsWith("<") || trimmed.startsWith("import ") || trimmed.startsWith("export ")) {
      index += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index].trim()) && !lines[index].trim().startsWith("<")) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    if (paragraph.length > 0) blocks.push({ kind: "paragraph", children: parseInline(paragraph.join(" ")) });
    else index += 1;
  }

  return blocks;
};

export const markdownHeadings = (blocks: Block[]): Heading[] =>
  blocks.flatMap((block) => (block.kind === "heading" ? [{ id: block.id, text: block.text, level: block.level }] : []));

const blockText = (block: Block): string => {
  switch (block.kind) {
    case "heading":
      return block.text;
    case "paragraph":
      return inlineText(block.children);
    case "list":
      return block.items.map(inlineText).join(" ");
    case "note":
      return block.children.map(inlineText).join(" ");
    case "code":
      return block.text;
    case "table":
      return [...block.head, ...block.rows.flat()].map(inlineText).join(" ");
  }
};

export const markdownWordCount = (blocks: Block[]): number =>
  blocks.map(blockText).join(" ").split(/\s+/).filter(Boolean).length;

const NBSP = "\u00a0";

// French typography: a no-break space before ? ! : ; » and after «, so the mark never wraps alone.
export const frenchSpacing = (text: string): string =>
  text.replace(/ ([?!:;»])/g, `${NBSP}$1`).replace(/« /g, `«${NBSP}`);

const mapInline = (nodes: Inline[], transform: (text: string) => string): Inline[] =>
  nodes.map((node) => {
    if (node.kind === "text") return { ...node, text: transform(node.text) };
    if (node.kind === "code") return node;
    return { ...node, children: mapInline(node.children, transform) };
  });

export const mapBlockText = (blocks: Block[], transform: (text: string) => string): Block[] =>
  blocks.map((block) => {
    switch (block.kind) {
      case "heading":
        return { ...block, text: transform(block.text), children: mapInline(block.children, transform) };
      case "paragraph":
        return { ...block, children: mapInline(block.children, transform) };
      case "list":
        return { ...block, items: block.items.map((item) => mapInline(item, transform)) };
      case "note":
        return { ...block, children: block.children.map((part) => mapInline(part, transform)) };
      case "table":
        return {
          ...block,
          head: block.head.map((cell) => mapInline(cell, transform)),
          rows: block.rows.map((row) => row.map((cell) => mapInline(cell, transform))),
        };
      case "code":
        return block;
    }
  });
