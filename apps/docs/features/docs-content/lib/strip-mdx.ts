export const stripMdx = (content: string): string =>
  content
    .replace(/^---[\s\S]*?---\n/, "")
    .replace(/<\/?[A-Za-z][^>\n]*>/g, "")
    .replace(/>\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();