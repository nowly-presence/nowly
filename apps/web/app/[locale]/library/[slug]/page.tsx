import { PresenceView } from "@/features/library/components/presence-view";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { localizedDescription } from "@/lib/library-catalog";
import { getPresenceBySlug, getPresenceCatalog, getPresenceStats, getPresenceVersionHistory, presenceLogoUrl } from "@/lib/presence-api";
import { createMetadata } from "@/features/seo/lib/seo";
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

  return createMetadata({
    title: presence.name,
    description: localizedDescription(presence, locale),
    locale,
    path: `/library/${presence.slug}`,
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

  return (
    <>
      <WebPageJsonLd
        name={presence.name}
        description={localizedDescription(presence, locale)}
        path={`/library/${presence.slug}`}
        crumbs={[
          { name: "Nowly", path: "/" },
          { name: library("title"), path: "/library" },
          { name: presence.name, path: `/library/${presence.slug}` },
        ]}
      />
      <PresenceView presence={presence} catalog={catalog} locale={locale} versions={versions} stats={stats} />
    </>
  );
};

export default Page;
