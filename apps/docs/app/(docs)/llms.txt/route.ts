import { getDocContent, getNavigationItems } from "@/lib/docs/content";
import { DOCS_URL } from "@/lib/constants";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";

export const GET = async () => {
  const t = await getTranslations({ locale: "en-US", namespace: "docsMetadata" });
  const sections = getNavigationItems("en-US");
  const lines: string[] = [
    `# ${t("title")}`,
    `> ${t("description")}`,
    "",
    `## ${t("documentation")}`,
    "",
  ];

  for (const section of sections) {
    if (section.slug === "changelog") continue;

    for (const page of section.children) {
      const doc = getDocContent(page.path, "en-US");
      if (!doc) continue;

       lines.push(`- [${doc.title}](${DOCS_URL}/${doc.path}): ${doc.description || t("doc-description", { title: doc.title })}`);
    }
  }

  const changelog = sections.find((section) => section.slug === "changelog");
  if (changelog) {
    lines.push("", `## ${t("changelog")}`, "");

    for (const page of changelog.children) {
      const doc = getDocContent(page.path, "en-US");
      if (!doc) continue;

       lines.push(`- [${doc.title}](${DOCS_URL}/${doc.path}): ${doc.description || t("changelog-description")}`);
    }
  }

  lines.push("", `## ${t("resources")}`, "", `- [${t("github")}](https://github.com/nowly-presence/nowly)`, "- [Discord Rich Presence](https://discord.com/rich-presence)");

  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
