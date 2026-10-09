import { FALLBACK_LOCALE } from "@nowly/locales";
import { getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";

import { getGuides } from "@/features/guides/lib/guides";
import { getPresenceCatalog } from "@/lib/presence-api";
import { CANONICAL_ORIGIN, DOCS_ORIGIN } from "@/features/seo/lib/seo";

export const runtime = "nodejs";

const pageDefinitions = [
  ["/", "metadata"],
  ["/library", "pages.library"],
  ["/guides", "pages.guides"],
  ["/faq", "faqPage"],
  ["/desktop", "pages.desktop"],
  ["/extension", "pages.extension"],
  ["/changelog", "pages.changelog"],
  ["/canary", "pages.canary"],
  ["/support", "pages.support"],
  ["/status", "pages.status"],
  ["/branding", "pages.branding"],
  ["/about", "pages.about"],
  ["/privacy", "privacy-page"],
  ["/consent", "pages.consent"],
  ["/tos", "tos-page"],
  ["/cookies", "cookies-page"],
  ["/legal-notice", "legal-notice-page"],
] as const;

const markdownText = (value: string): string => value.replace(/[\r\n]+/g, " ").trim();

export const GET = async () => {
  const [t, catalog] = await Promise.all([
    getTranslations({ locale: FALLBACK_LOCALE }),
    getPresenceCatalog().catch(() => []),
  ]);
  const lines: string[] = [
    "# Nowly",
    "",
    "> Nowly turns what you watch, listen to, or play into a rich, live Discord presence.",
    "",
    "## Website",
    "",
  ];

  for (const [path, namespace] of pageDefinitions) {
    const title = t(`${namespace}.title`);
    const description = t(`${namespace}.description`);
    lines.push(`- [${markdownText(title)}](${CANONICAL_ORIGIN}${path}): ${markdownText(description)}`);
  }

  lines.push("", "## Guides", "");
  for (const guide of getGuides(FALLBACK_LOCALE)) {
    lines.push(`- [${markdownText(guide.title)}](${CANONICAL_ORIGIN}/guides/${guide.slug}): ${markdownText(guide.description)}`);
  }

  lines.push(
    "",
    "## Presence library",
    "",
    "- [Browse every supported platform](https://nowly.me/library): Search and install signed presence scripts.",
  );

  for (const presence of catalog) {
    lines.push(
      `- [${markdownText(presence.name)}](${CANONICAL_ORIGIN}/library/${encodeURIComponent(presence.slug)}): ${markdownText(presence.description[FALLBACK_LOCALE])}`,
    );
  }

  lines.push(
    "",
    "## Documentation and resources",
    "",
    `- [Nowly documentation](${DOCS_ORIGIN}/): Build, test, and publish presence scripts.`,
    `- [Documentation llms.txt](${DOCS_ORIGIN}/llms.txt): Documentation index for language models.`,
    "- [GitHub repository](https://github.com/nowly-presence/nowly): Source code and issue tracker.",
    "- [Discord Rich Presence](https://discord.com/rich-presence): Discord's Rich Presence reference.",
  );

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
