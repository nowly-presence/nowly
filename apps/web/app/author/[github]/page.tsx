import { AuthorView } from "@/components/library/author-view";
import {
  catalogGithubHandles,
  contributorDisplayName,
  normalizeGithub,
  presenceMatchesGithub,
} from "@/lib/library-catalog";
import { getPresenceCatalog } from "@/lib/presence-api";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type AuthorPageProps = {
  params: Promise<{ github: string }>
};

export const generateStaticParams = async () => {
  const catalog = await getPresenceCatalog();
  return catalogGithubHandles(catalog).map((github) => ({ github }));
};

export const generateMetadata = async ({ params }: AuthorPageProps): Promise<Metadata> => {
  const { github } = await params;
  const handle = normalizeGithub(github);
  const catalog = await getPresenceCatalog();
  const authored = catalog.filter((presence) => presenceMatchesGithub(presence, handle));
  const t = await getTranslations("authorPage");
  const name = authored[0] ? contributorDisplayName(authored[0], handle) : handle;

  return createMetadata({
    title: name,
    description: authored.length > 0
      ? t("meta-description", { name })
      : name,
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

  return <AuthorView handle={handle} items={authored} />;
};

export default Page;
