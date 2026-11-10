import { createOgImageResponse } from "@nowly/og/image-response";
import { getLocale, getTranslations } from "next-intl/server";

export const runtime = "nodejs";

export const GET = async (req: Request) => {
  const locale = await getLocale();

  const { searchParams } = new URL(req.url);
  const t = await getTranslations({
    locale,
    namespace: "docsMetadata"
  });

  return createOgImageResponse({
    title: searchParams.get("title") ?? t("title"),
    description: searchParams.get("description") ?? t("description"),
    badge: searchParams.get("badge") ?? searchParams.get("category") ?? t("documentation")
  });
};