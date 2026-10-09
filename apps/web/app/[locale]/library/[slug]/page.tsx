import { PresenceView } from "@/features/library/components/presence-view";
import { getPresenceGuide } from "@/features/library/lib/presence-guide";
import { localizedDescription, presenceIndexLocales } from "@/lib/library-catalog";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { getPresenceBySlug, getPresenceCatalog, getPresenceStats, getPresenceVersionHistory, presenceLogoUrl } from "@/lib/presence-api";
import { createMetadata } from "@/features/seo/lib/seo";
import { FALLBACK_LOCALE, getValidLocale } from "@nowly/locales";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type PresencePageProps = {
  params: Promise<{ slug: string }>
};

export const generateMetadata = async ({ params }: PresencePageProps): Promise<Metadata> => {
  const { slug } = await params;
  const [presence, locale, t, categoryLabels] = await Promise.all([
    getPresenceBySlug(slug),
    getLocale(),
    getTranslations("pages.library"),
    getTranslations("libraryPage"),
  ]);

  if (!presence) {
    return createMetadata({
      title: t("title"),
      description: t("description"),
      locale,
      path: `/library/${slug}`,
      noIndex: true,
    });
  }

  const seoTitle = `${presence.name} Discord Rich Presence`;
  const guide = getPresenceGuide(presence.slug, locale);
  const indexLocales = presenceIndexLocales(presence);

  return createMetadata({
    title: seoTitle,
    locale,
    description: guide?.translated && guide.meta.description ? guide.meta.description : localizedDescription(presence, locale),
    path: `/library/${presence.slug}`,
    alternateLocales: indexLocales,
    canonicalLocale: indexLocales.includes(getValidLocale(locale)) ? undefined : FALLBACK_LOCALE,
    badge: categoryLabels(`categories.${presence.category}`),
    accent: presence.color,
    logo: presenceLogoUrl(presence.slug),
  });
};

const Page = async ({ params }: PresencePageProps) => {
  const { slug } = await params;
  const [presence, catalog, locale, versions, stats] = await Promise.all([
    getPresenceBySlug(slug),
    getPresenceCatalog(),
    getLocale(),
    getPresenceVersionHistory(slug),
    getPresenceStats(slug),
  ]);

  if (!presence) notFound();

  const library = await getTranslations("pages.library");
  const guide = getPresenceGuide(presence.slug, locale);
  return (
    <>
      <WebPageJsonLd
        name={`${presence.name} Discord Rich Presence`}
        description={localizedDescription(presence, locale)}
        path={`/library/${presence.slug}`}
        crumbs={[
          { name: "Nowly", path: "/" },
          { name: library("title"), path: "/library" },
          { name: presence.name, path: `/library/${presence.slug}` },
        ]}
      />
      <PresenceView
        presence={presence}
        catalog={catalog}
        locale={locale}
        versions={versions}
        stats={stats}
        guide={guide}
      />
    </>
  );
};

export default Page;
