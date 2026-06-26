import { StructuredContentPage } from "@/components/layout/structured-content-page";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type PageSection = {
  title: string
  body: string
};

const PUBLISHER = {
  name: "Anthony Lejeune",
  siren: "105 793 194",
  address: "7 rue d'Arras, 62450 Bapaume, France",
  email: "contact@qkimi.fr",
  dataRegion: "EU West (Amsterdam, Netherlands)",
};

const injectPublisherInfo = (body: string): string =>
  body
    .replaceAll("{publisherName}", PUBLISHER.name)
    .replaceAll("{publisherSiren}", PUBLISHER.siren)
    .replaceAll("{publisherAddress}", PUBLISHER.address)
    .replaceAll("{publisherEmail}", PUBLISHER.email)
    .replaceAll("{dataRegion}", PUBLISHER.dataRegion);

const generateMetadata = (): Metadata => {
  return {
    title: "Legal Notice — Nowly",
    description: "Legal information about the publisher, hosting provider and intellectual property of Nowly.",
    openGraph: {
      title: "Legal Notice — Nowly",
      description: "Legal information about the publisher, hosting provider and intellectual property of Nowly.",
    },
  };
};

const Page = (): ReactElement => {
  const t = useTranslations("legal-notice-page");
  const sections = t.raw("sections") as PageSection[];
  const items = sections.map((section) => ({
    title: section.title,
    description: injectPublisherInfo(section.body),
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