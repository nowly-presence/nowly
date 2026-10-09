import { AboutView } from "@/features/about/components/about-view";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("pages.about")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/about",
  });
};

const Page = async () => {
  const t = await getTranslations("pages.about");
  return (
    <>
      <WebPageJsonLd
        name={t("title")}
        description={t("description")}
        path="/about"
        crumbs={[
          { name: "Nowly", path: "/" },
          { name: t("title"), path: "/about" },
        ]}
      />
      <AboutView />
    </>
  );
};

export default Page;
