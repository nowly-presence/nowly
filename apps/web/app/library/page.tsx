import { LibraryView } from "@/components/library/library-view";
import { normalizeGithub } from "@/lib/library-catalog";
import { getPresenceCatalog } from "@/lib/presence-api";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("pages.library");
  return createMetadata({
    title: t("title"),
    description: t("description"),
    path: "/library",
  });
};

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ author?: string | string[] }>
}) => {
  const [{ author }, items] = await Promise.all([
    searchParams,
    getPresenceCatalog(),
  ]);
  const authorValue = Array.isArray(author) ? author[0] : author;
  const authorHandle = authorValue ? normalizeGithub(authorValue) : null;

  return <LibraryView items={items} authorHandle={authorHandle || null} />;
};

export default Page;
