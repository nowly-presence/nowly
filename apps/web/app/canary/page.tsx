import { CanaryView } from "@/components/canary/canary-view";
import { BRAND_LOCKUP_CANARY_PNG } from "@/lib/brand";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("pages.canary");
  return createMetadata({
    title: t("title"),
    description: t("description"),
    path: "/canary",
    image: BRAND_LOCKUP_CANARY_PNG,
  });
};

const Page = async () => <CanaryView />;

export default Page;
