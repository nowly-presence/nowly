import { RedeemView } from "@/components/redeem/redeem-view";
import { WebPageJsonLd } from "@/components/seo/web-page-json-ld";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type PageProps = {
  searchParams: Promise<{ code?: string | string[] }>
};

const firstParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
};

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("pages.redeem");
  return createMetadata({
    title: t("title"),
    description: t("description"),
    path: "/redeem",
  });
};

const Page = async ({ searchParams }: PageProps) => {
  const t = await getTranslations("pages.redeem");
  const params = await searchParams;

  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/redeem" />
      <RedeemView initialCode={firstParam(params.code)} />
    </>
  );
};

export default Page;
