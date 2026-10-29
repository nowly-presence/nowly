import { getDocOgMetadata } from "@/features/docs-content/lib/og-metadata";
import { createOgImageResponse } from "@nowly/og/image-response";
import { getLocale, getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{
    slug?: string[];
  }>;
};

export const runtime = "nodejs";

export const GET = async (req: Request, { params }: Props) => {
  const [{ slug }, locale] = await Promise.all([
    params,
    getLocale()
  ]);

  const pageSlug = slug?.join("/") || "getting-started/introduction";
  const docSlug = pageSlug.split("/").at(-1) ?? pageSlug;
  const { searchParams } = new URL(req.url);
  const docMetadata = getDocOgMetadata(pageSlug, locale) ?? getDocOgMetadata(docSlug, locale);
  const t = await getTranslations({
    locale,
    namespace: "docsMetadata"
  });

  return createOgImageResponse({
    title: searchParams.get("title") ?? docMetadata?.title ?? t("title"),
    description: searchParams.get("description") ?? docMetadata?.description ?? t("description"),
    badge: searchParams.get("badge") ?? searchParams.get("category") ?? docMetadata?.category ?? t("documentation")
  });
};