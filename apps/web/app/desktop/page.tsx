import { DesktopView } from "@/components/desktop/desktop-view";
import { getDesktopRelease } from "@/lib/desktop-release";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("pages.desktop");
  return createMetadata({
    title: t("title"),
    description: t("description"),
    path: "/desktop",
  });
};

const Page = async () => {
  const release = await getDesktopRelease();
  return <DesktopView release={release} />;
};

export default Page;
