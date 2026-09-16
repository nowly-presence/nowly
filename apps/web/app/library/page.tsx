import { LibraryView } from "@/components/library/library-view";
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

const Page = async () => {
  const items = await getPresenceCatalog();
  return <LibraryView items={items} />;
};

export default Page;
