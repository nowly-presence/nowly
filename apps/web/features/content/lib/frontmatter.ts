export type ContentMeta = Record<string, string>;

// `key: value` lines between two `---` fences. Values are plain strings; nothing is evaluated.
export const parseFrontmatter = (source: string): { meta: ContentMeta; body: string } => {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(source.replace(/\r\n?/g, "\n"));
  if (!match) return { meta: {}, body: source };
  const meta: ContentMeta = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key) meta[key] = value;
  }
  return { meta, body: source.replace(/\r\n?/g, "\n").slice(match[0].length) };
};
