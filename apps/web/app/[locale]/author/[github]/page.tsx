import { AuthorView } from "@/components/library/author-view";
import { WebPageJsonLd } from "@/components/seo/web-page-json-ld";
import {
  contributorDisplayName,
  normalizeGithub,
  presenceMatchesGithub,
} from "@/lib/library-catalog";
import { getPresenceCatalog } from "@/lib/presence-api";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type AuthorPageProps = {
  params: Promise<{ github: string }>
};

export const generateMetadata = async ({ params }: AuthorPageProps): Promise<Metadata> => {
  const { github } = await params;
  const handle = normalizeGithub(github);
  const [catalog, locale, t] = await Promise.all([
    getPresenceCatalog(),
    getLocale(),
    getTranslations("authorPage"),
  ]);
  const authored = catalog.filter((presence) => presenceMatchesGithub(presence, handle));
  const name = authored[0] ? contributorDisplayName(authored[0], handle) : handle;

  return createMetadata({
    title: name,
    description: authored.length > 0
      ? t("meta-description", { name })
      : name,
    locale,
    path: `/author/${handle}`,
    noIndex: authored.length === 0,
  });
};

const Page = async ({ params }: AuthorPageProps) => {
  const { github } = await params;
  const handle = normalizeGithub(github);
  if (!handle) notFound();

  const catalog = await getPresenceCatalog();

  const authored = catalog.filter((presence) => presenceMatchesGithub(presence, handle));
  if (authored.length === 0) notFound();

  const t = await getTranslations("authorPage");
  const author = authored[0];
  if (!author) notFound();
  const name = contributorDisplayName(author, handle);

  return (
    <>
      <WebPageJsonLd
        name={name}
        description={t("meta-description", { name })}
        path={`/author/${handle}`}
      />
      <AuthorView handle={handle} items={authored} />
    </>
  );
};

export default Page;
