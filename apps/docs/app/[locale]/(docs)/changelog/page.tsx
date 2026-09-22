import { EditOnGitHub } from "@/features/docs-content/components/edit-on-github";
import { mdxComponents } from "@/features/docs-content/components/mdx-components";
import { ScrollToTop } from "@/features/docs-content/components/scroll-to-top";
import { TableOfContents } from "@/features/docs-content/components/table-of-contents";
import { Link } from "@/i18n/navigation";
import { getDocContent } from "@/features/docs-content/lib/content";
import { extractTocItems } from "@/features/docs-content/lib/types";
import { createMetadata, docsOgImage } from "@/features/seo/lib/seo";
import { getChangelogList } from "@nowly/changelog";
import type { LocaleString } from "@nowly/locales";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

const CHANGELOG_SLUG = "changelog";

const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getLocale();
  const t = await getTranslations("docsMetadata");
  const doc = getDocContent(CHANGELOG_SLUG, locale);

  if (!doc) {
    return { title: t("not-found"), robots: { index: false, follow: false } };
  }

  const description = doc.description || t("changelog-description");

  return createMetadata({
    title: doc.title,
    description,
    locale: locale as LocaleString,
    path: "/changelog",
    type: "article",
    image: docsOgImage("changelog", {
      title: doc.title,
      description,
       category: t("changelog"),
    }),
  });
};

const Page = async (): Promise<ReactElement> => {
  const locale = await getLocale();
  const doc = getDocContent(CHANGELOG_SLUG, locale);

  if (!doc) {
    notFound();
  }

  const releases = getChangelogList(locale);
  const tocItems = extractTocItems(doc.content);

  return (
    <>
      <ScrollToTop />
      <article className="py-8">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl font-semibold font-heading">
            {doc.title}
          </h1>
        </div>

        {doc.description && (
          <p className="text-muted-foreground mb-8 text-lg">
            {doc.description}
          </p>
        )}

        <MDXRemote source={doc.content} components={mdxComponents} options={{ blockJS: false }} />

        {releases.map((release) => (
          <div key={release.slug} className="mb-2 [&+div]:mt-6">
            <h2 className="text-2xl font-semibold mt-10 mb-3">
              <Link href={`/changelog/${release.slug}`} className="hover:underline">
                {release.version}
              </Link>
            </h2>
            {release.description && <p className="mb-4 leading-relaxed text-foreground/85">{release.description}</p>}
          </div>
        ))}

        <div className="mt-8 flex items-center border-t border-border pt-4">
          <EditOnGitHub slug={CHANGELOG_SLUG} locale="en-US" />
        </div>
      </article>

      <TableOfContents items={tocItems} />
    </>
  );
};

export { generateMetadata };

export default Page;
