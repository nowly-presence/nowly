import { getDocContent, getNavigationItems } from "@/lib/docs/content";
import { DOCS_URL } from "@/lib/constants";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = async () => {
  const sections = getNavigationItems("en-US");
  const lines: string[] = [
    "# Nowly Documentation",
    "> Automatically update your Discord status with what you're watching on streaming platforms.",
    "",
    "## Documentation",
    "",
  ];

  for (const section of sections) {
    if (section.slug === "changelog") continue;

    for (const page of section.children) {
      const doc = getDocContent(page.path, "en-US");
      if (!doc) continue;

      lines.push(`- [${doc.title}](${DOCS_URL}/${doc.path}): ${doc.description || "Documentation for " + doc.title}`);
    }
  }

  const changelog = sections.find((section) => section.slug === "changelog");
  if (changelog) {
    lines.push("", "## Changelog", "");

    for (const page of changelog.children) {
      const doc = getDocContent(page.path, "en-US");
      if (!doc) continue;

      lines.push(`- [${doc.title}](${DOCS_URL}/${doc.path}): ${doc.description || "Release notes for Nowly."}`);
    }
  }

  lines.push("", "## Resources", "", "- [GitHub Repository](https://github.com/nowly-presence/nowly)", "- [Discord Rich Presence](https://discord.com/rich-presence)");

  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
