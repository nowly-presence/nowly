import { AccountView } from "@/features/account/components/account-view";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("pages.account")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/account",
    noIndex: true,
  });
};

const Page = () => <AccountView />;

export default Page;
