import { EditOnGitHub } from "@/features/docs-content/components/edit-on-github";
import { mdxComponents } from "@/features/docs-content/components/mdx-components";
import { OpenIn } from "@/features/docs-content/components/open-in";
import { PageNavigation } from "@/features/docs-content/components/page-navigation";
import { TableOfContents } from "@/features/docs-content/components/table-of-contents";
import { getAdjacentPages, getCategoryForPath, getDocContent } from "@/features/docs-content/lib/content";
import { docHref } from "@/features/docs-content/lib/href";
import { extractTocItems } from "@/features/docs-content/lib/types";
import { createMetadata, docsOgImage } from "@/features/seo/lib/seo";
import type { LocaleString } from "@nowly/locales";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { ScrollToTop } from "@/features/docs-content/components/scroll-to-top";
import type { ReactElement } from "react";

type Props = {
  params: Promise<{
    slug: string[]
  }>;
};

const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const locale = await getLocale();
  const t = await getTranslations("docsMetadata");
  const { slug } = await params;
  const pageSlug = slug.join("/");
  const doc = getDocContent(pageSlug, locale);

  if (!doc) {
    return {
       title: t("not-found"),
      robots: { index: false, follow: false },
    };
  }

  const description = doc.description || t("documentation-description");

  return createMetadata({
    title: doc.title,
    description,
    locale: locale as LocaleString,
    path: docHref(doc.path),
    image: docsOgImage(doc.path, {
      title: doc.title,
      description,
       category: getCategoryForPath(pageSlug, locale),
    }),
  });
};

const Page = async ({ params }: Props): Promise<ReactElement> => {
  const locale = await getLocale();
  const { slug } = await params;

  const pageSlug = slug.join("/");
  const doc = getDocContent(pageSlug, locale);

  if (!doc) {
    notFound();
  }

  const tocItems = extractTocItems(doc.content);
  const { prev, next } = getAdjacentPages(doc.path, locale);

  return (
    <>
      <ScrollToTop />
      <article className="py-8">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl font-semibold font-heading">
            {doc.title}
          </h1>
          <OpenIn slug={doc.sourcePath} locale={locale} />
        </div>

        {doc.description && (
          <p className="text-muted-foreground mb-8 text-lg">
            {doc.description}
          </p>
        )}

        <MDXRemote source={doc.content} components={mdxComponents} options={{ blockJS: false }} />

        <div className="mt-8 flex items-center border-t border-border pt-4">
          <EditOnGitHub slug={doc.sourcePath} locale={locale} />
        </div>

        <PageNavigation prev={prev} next={next} />
      </article>

      <TableOfContents items={tocItems} />
    </>
  );
};

export { generateMetadata };

export default Page;
