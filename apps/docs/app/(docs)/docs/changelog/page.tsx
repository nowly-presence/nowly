import { EditOnGitHub } from "@/components/docs/edit-on-github";
import { mdxComponents } from "@/components/docs/mdx-components";
import { ScrollToTop } from "@/components/docs/scroll-to-top";
import { TableOfContents } from "@/components/docs/table-of-contents";
import { getDocContent } from "@/lib/docs/content";
import { extractTocItems } from "@/lib/docs/types";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

const CHANGELOG_SLUG = "changelog";

const generateMetadata = async (): Promise<Metadata> => {
  const doc = getDocContent(CHANGELOG_SLUG, "en-US");

  if (!doc) {
    return { title: "Not Found" };
  }

  return createMetadata({
    title: doc.title,
    description: doc.description || "Release notes for Nowly.",
    path: "/docs/changelog",
    type: "article",
  });
};

const Page = async (): Promise<ReactElement> => {
  const locale = await getLocale();
  const doc = getDocContent(CHANGELOG_SLUG, locale);

  if (!doc) {
    notFound();
  }

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