import { StructuredContentPage } from "@/components/layout/structured-content-page";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type PageSection = {
  title: string
  body: string
};

const generateMetadata = (): Metadata => createMetadata({
  title: "Terms of Service",
  description: "Terms of Service for Nowly. Please read before using the browser extension, Nowly Host and website.",
  path: "/tos",
});

const Page = (): ReactElement => {
  const t = useTranslations("tos-page");
  const sections = t.raw("sections") as PageSection[];
  const items = sections.map((section) => ({
    title: section.title,
    description: section.body,
  }));

  return (
    <StructuredContentPage
      badge={t("badge")}
      title={t("title")}
      description={t("description")}
      lastUpdated={t("last-updated")}
      items={items}
    />
  );
};

export { generateMetadata };

export default Page;