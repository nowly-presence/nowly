import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const accountMetadata = async (title: "account-title" | "connect-title" | "submission-title", description:
  "account-description" | "connect-description" | "submission-description"): Promise<Metadata> => {
  const t = await getTranslations("accountMeta");
  return {
    title: t(title),
    description: t(description),
    robots: {
      index: false,
      follow: false
    }
  };
};