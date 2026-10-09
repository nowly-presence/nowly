import { AdSlot } from "@/features/ads/components/ad-slot";
import { GuideView } from "@/features/guides/components/guide-view";
import { getGuide } from "@/features/guides/lib/guides";
import { JsonLd } from "@/features/seo/components/json-ld";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { CANONICAL_ORIGIN, createMetadata, organizationJsonLd, seoUrl } from "@/features/seo/lib/seo";
import { getPathname } from "@/i18n/navigation";
import type { LocaleString } from "@nowly/locales";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type GuidePageProps = {
  params: Promise<{ slug: string }>
};

export const generateMetadata = async ({ params }: GuidePageProps): Promise<Metadata> => {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const guide = getGuide(slug, locale);
  if (!guide) {
    const t = await getTranslations("pages.guides");
    return createMetadata({ title: t("title"), description: t("description"), locale, path: `/guides/${slug}`, noIndex: true });
  }

  return createMetadata({
    title: guide.title,
    description: guide.description,
    locale,
    path: `/guides/${guide.slug}`,
    alternateLocales: guide.entry.locales,
    canonicalLocale: guide.entry.translated ? undefined : guide.entry.locale,
  });
};

const Page = async ({ params }: GuidePageProps) => {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const guide = getGuide(slug, locale);
  if (!guide) notFound();

  const t = await getTranslations("pages.guides");
  const path = `/guides/${guide.slug}`;
  const url = seoUrl(getPathname({ locale: locale as LocaleString, href: path }));

  return (
    <>
      <WebPageJsonLd
        name={guide.title}
        description={guide.description}
        path={path}
        crumbs={[
          { name: "Nowly", path: "/" },
          { name: t("title"), path: "/guides" },
          { name: guide.title, path },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: guide.title,
          description: guide.description,
          inLanguage: guide.entry.locale,
          url,
          ...(guide.updated ? { dateModified: guide.updated } : {}),
          author: { "@id": `${CANONICAL_ORIGIN}/#organization` },
          publisher: organizationJsonLd(),
          wordCount: guide.entry.words,
        }}
      />
      <GuideView guide={guide} beforeRelated={<AdSlot placement="guides" className="mt-16" />} />
    </>
  );
};

export default Page;
