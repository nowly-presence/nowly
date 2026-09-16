import { createMetadata } from "@/lib/seo";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

type PlaceholderPageProps = {
  pageKey: "library" | "host" | "changelog" | "support" | "privacy" | "tos" | "cookies" | "legal-notice"
  path: string
  heading?: string
};

export const generatePlaceholderMetadata = async (pageKey: PlaceholderPageProps["pageKey"], path: string) => {
  const t = await getTranslations(`pages.${pageKey}`);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    path,
  });
};

export const PlaceholderPage = async ({
  pageKey,
  heading,
}: Pick<PlaceholderPageProps, "pageKey" | "heading">): Promise<ReactNode> => {
  const t = await getTranslations(`pages.${pageKey}`);
  const p = await getTranslations("placeholder");

  return (
    <section className="mx-auto flex min-h-[50vh] max-w-2xl flex-col justify-center px-5 py-20 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">{p("badge")}</p>
      <h1 className="mt-4 text-3xl font-medium text-foreground">{heading ?? t("title")}</h1>
      <p className="mt-3 text-[15px] text-muted-foreground">{t("description")}</p>
      <p className="mt-6 text-sm text-muted-foreground">{p("description")}</p>
    </section>
  );
};
