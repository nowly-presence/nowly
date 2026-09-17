import { PresenceView } from "@/components/library/presence-view";
import { WebPageJsonLd } from "@/components/seo/web-page-json-ld";
import { localizedDescription } from "@/lib/library-catalog";
import { getLatestPresenceCommit, getPresenceBySlug, getPresenceCatalog, presenceThumbnailUrl } from "@/lib/presence-api";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type PresencePageProps = {
  params: Promise<{ slug: string }>
};

export const generateStaticParams = async () => {
  const catalog = await getPresenceCatalog();
  return catalog.map((presence) => ({ slug: presence.slug }));
};

export const generateMetadata = async ({ params }: PresencePageProps): Promise<Metadata> => {
  const { slug } = await params;
  const [presence, locale, t] = await Promise.all([
    getPresenceBySlug(slug),
    getLocale(),
    getTranslations("pages.library"),
  ]);

  if (!presence) {
    return createMetadata({
      title: t("title"),
      description: t("description"),
      path: `/library/${slug}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: presence.name,
    description: localizedDescription(presence, locale),
    path: `/library/${presence.slug}`,
    image: presenceThumbnailUrl(presence.slug),
  });
};

const Page = async ({ params }: PresencePageProps) => {
  const { slug } = await params;
  const [presence, catalog, locale, commit] = await Promise.all([
    getPresenceBySlug(slug),
    getPresenceCatalog(),
    getLocale(),
    getLatestPresenceCommit(slug),
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
      <PresenceView presence={presence} catalog={catalog} locale={locale} commit={commit} />
    </>
  );
};

export default Page;
