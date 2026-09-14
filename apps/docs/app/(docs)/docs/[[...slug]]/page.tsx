import { EditOnGitHub } from "@/components/docs/edit-on-github";
import { mdxComponents } from "@/components/docs/mdx-components";
import { OpenIn } from "@/components/docs/open-in";
import { PageNavigation } from "@/components/docs/page-navigation";
import { TableOfContents } from "@/components/docs/table-of-contents";
import { getAdjacentPages, getCategoryForPath, getDocContent, getFirstDocPath } from "@/lib/docs/content";
import { extractTocItems } from "@/lib/docs/types";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { ScrollToTop } from "@/components/docs/scroll-to-top";
import type { ReactElement } from "react";

type Props = {
  params: Promise<{
    slug?: string[]
  }>;
};

const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const locale = await getLocale();
  const { slug } = await params;
  const pageSlug = slug?.join("/") || getFirstDocPath();
  const doc = getDocContent(pageSlug, locale);

  if (!doc) {
    return {
      title: "Not Found",
      robots: { index: false, follow: false },
    };
  }

  const description = doc.description || "Nowly documentation for Discord Rich Presence setup and presence development.";
  const ogParams = new URLSearchParams({
    title: doc.title,
    description,
    category: getCategoryForPath(pageSlug, "en-US"),
    mode: "dark",
  });

  return createMetadata({
    title: doc.title,
    description,
    path: `/docs/${doc.path}`,
    image: `/api/og/docs/${doc.path}?${ogParams.toString()}`,
  });
};

const Page = async ({ params }: Props): Promise<ReactElement> => {
  const locale = await getLocale();
  const { slug } = await params;

  const pageSlug = slug?.join("/") || getFirstDocPath();
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