import { ExtensionConnectView } from "@/features/account/components/extension-connect-view";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("pages.extensionConnect")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/extension/connect",
    noIndex: true,
  });
};

const Page = () => (
  <Suspense>
    <ExtensionConnectView />
  </Suspense>
);

export default Page;
