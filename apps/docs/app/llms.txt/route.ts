import { listDocs } from "@/features/docs-content/lib/content";
import { DISCORD_SITE_URL, DOCS_URL, PROJECT_REPOSITORY_URL } from "@/lib/constants";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";

export const GET = async () => {
  const t = await getTranslations({
    locale: "en-US",
    namespace: "docsMetadata"
  });

  const sections = listDocs("en-US");
  const lines: string[] = [`# ${t("title")}`, `> ${t("description")}`, "", `## ${t("documentation")}`, ""];

  for (const { section, docs } of sections) {
    if (section.slug === "changelog") continue;

    for (const doc of docs) {
      lines.push(`- [${doc.title}](${DOCS_URL}/${doc.path}): ${doc.description || t("doc-description", { title: doc.title })}`);
    }
  }

  const changelog = sections.find(({ section }) => section.slug === "changelog");

  if (changelog) {
    lines.push("", `## ${t("changelog")}`, "");

    for (const doc of changelog.docs) {
      lines.push(`- [${doc.title}](${DOCS_URL}/${doc.path}): ${doc.description || t("changelog-description")}`);
    }
  }

  lines.push("", `## ${t("resources")}`, "", `- [${t("github")}](${PROJECT_REPOSITORY_URL})`, `- [Discord Rich Presence](${DISCORD_SITE_URL}/rich-presence)`);

  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
};