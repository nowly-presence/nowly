import { getDocContent, getNavigationItems } from "@/lib/docs/content";
import { NextResponse } from "next/server";

const stripMdx = (content: string): string => {
  return content
    .replace(/---[\s\S]*?---\n/, "")
    .replace(/>\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();
};

export const GET = async () => {
  const sections = getNavigationItems("en-US");
  const parts: string[] = ["# Nowly Documentation\n"];

  for (const section of sections) {
    if (section.slug === "changelog") continue;

    for (const page of section.children) {
      const doc = getDocContent(page.path, "en-US");
      if (!doc) continue;

      const body = stripMdx(doc.content);
      parts.push(`# ${doc.title}\n\n${body}\n`);
    }
  }

  const changelog = sections.find((section) => section.slug === "changelog");
  if (changelog) {
    parts.push("", "## Changelog", "");

    for (const page of changelog.children) {
      const doc = getDocContent(page.path, "en-US");
      if (!doc) continue;

      const body = stripMdx(doc.content);
      parts.push(`### ${doc.title}\n\n${body}\n`);
    }
  }

  return new NextResponse(parts.join("\n---\n\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
