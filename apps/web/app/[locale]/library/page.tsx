import { LibraryView } from "@/features/library/components/library-view";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { normalizeGithub } from "@/lib/library-catalog";
import { getPresenceCatalog } from "@/lib/presence-api";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("pages.library")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/library",
  });
};

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ author?: string | string[] }>
}) => {
  const [{ author }, items, t] = await Promise.all([
    searchParams,
    getPresenceCatalog(),
    getTranslations("pages.library"),
  ]);
  const authorValue = Array.isArray(author) ? author[0] : author;
  const authorHandle = authorValue ? normalizeGithub(authorValue) : null;

  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/library" />
      <LibraryView items={items} authorHandle={authorHandle || null} />
    </>
  );
};

export default Page;
