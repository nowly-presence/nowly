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
  title: "Privacy Policy",
  description: "Privacy Policy for Nowly. Learn how your data is processed locally and what information is collected.",
  path: "/privacy",
});

const Page = (): ReactElement => {
  const t = useTranslations("privacy-page");
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
      intro={t.raw("intro") as string}
      items={items}
    />
  );
};

export { generateMetadata };

export default Page;