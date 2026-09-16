import { PlaceholderPage } from "@/components/placeholder-page";
import { getPresencePlatforms } from "@/lib/presence-api";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type PresencePageProps = {
  params: Promise<{ slug: string }>
};

export const generateMetadata = async ({ params }: PresencePageProps): Promise<Metadata> => {
  const { slug } = await params;
  const [platforms, t] = await Promise.all([
    getPresencePlatforms(),
    getTranslations("pages.library"),
  ]);
  const presence = platforms.find((item) => item.slug === slug);

  return createMetadata({
    title: presence?.name ?? t("title"),
    description: t("description"),
    path: `/library/${slug}`,
  });
};

const Page = async ({ params }: PresencePageProps) => {
  const { slug } = await params;
  const platforms = await getPresencePlatforms();
  const presence = platforms.find((item) => item.slug === slug);

  if (!presence) notFound();

  return <PlaceholderPage pageKey="library" heading={presence.name} />;
};

export default Page;
