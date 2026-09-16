import { ChangelogView } from "@/components/changelog/changelog-view";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("pages.changelog");
  return createMetadata({
    title: t("title"),
    description: t("description"),
    path: "/changelog",
  });
};

const Page = async () => <ChangelogView />;

export default Page;
