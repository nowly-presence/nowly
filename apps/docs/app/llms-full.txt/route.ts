import { listDocs } from "@/features/docs-content/lib/content";
import { stripMdx } from "@/features/docs-content/lib/strip-mdx";
import { NextResponse } from "next/server";

export const GET = async () => {
  const sections = listDocs("en-US");
  const parts: string[] = ["# Nowly Documentation\n"];

  for (const { section, docs } of sections) {
    if (section.slug === "changelog") continue;

    for (const doc of docs) {
      parts.push(`# ${doc.title}\n\n${stripMdx(doc.content)}\n`);
    }
  }

  const changelog = sections.find(({ section }) => section.slug === "changelog");

  if (changelog) {
    parts.push("", "## Changelog", "");

    for (const doc of changelog.docs) {
      parts.push(`### ${doc.title}\n\n${stripMdx(doc.content)}\n`);
    }
  }

  return new NextResponse(parts.join("\n---\n\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
};