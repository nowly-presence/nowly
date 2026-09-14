import { SUPPORTED_LOCALES, type LocaleString } from "@nowly/locales";
import { getDocContent, getNavigationItems } from "@/lib/docs/content";
import { NextRequest, NextResponse } from "next/server";

type SearchResult = {
  title: string;
  href: string;
  description?: string;
  content: string;
  matches: number;
  matchContext?: string;
};

function stripMdx(content: string): string {
  return content
    .replace(/^---[\s\S]*?---\n/, "")
    .replace(/>\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
}

function countMatches(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let count = 0;
  let pos = 0;
  while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
    count++;
    pos += lowerQuery.length;
  }
  return count;
}

function findContext(text: string, query: string): string | undefined {
  const lower = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lower.indexOf(lowerQuery);
  if (idx === -1) return undefined;
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + query.length + 60);
  return text.slice(start, end).trim();
}

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const locale = searchParams.get("locale") || "en-US";

  if (!query) {
    return NextResponse.json([]);
  }

  const validLocale = SUPPORTED_LOCALES.includes(locale as LocaleString) ? locale : "en-US";
  const sections = getNavigationItems(validLocale);
  const results: SearchResult[] = [];

  for (const section of sections) {
    for (const page of section.children) {
      const doc = getDocContent(page.path, validLocale);
      if (!doc) continue;

      const title = doc.title;
      const description = doc.description || "";
      const body = stripMdx(doc.content);
      const searchableText = `${title} ${description} ${body}`.toLowerCase();
      const lowerQuery = query.toLowerCase();

      if (!searchableText.includes(lowerQuery)) continue;

      const titleMatches = countMatches(title, query) * 3;
      const descMatches = countMatches(description, query) * 2;
      const bodyMatches = countMatches(body, query);
      const totalMatches = titleMatches + descMatches + bodyMatches;

      const matchContext = findContext(body, query);

      results.push({
        title,
        href: `/docs/${doc.path}`,
        description,
        content: body.slice(0, 200),
        matches: totalMatches,
        matchContext,
      });
    }
  }

  results.sort((a, b) => b.matches - a.matches);
  return NextResponse.json(results);
};