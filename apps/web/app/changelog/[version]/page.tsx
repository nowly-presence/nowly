import { ChangelogReleaseView } from "@/components/changelog/changelog-view";
import { CHANGELOG_RELEASES, getChangelogRelease, parseChangelogVersion } from "@/lib/changelog-releases";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type ChangelogVersionPageProps = {
  params: Promise<{ version: string }>
};

export const generateStaticParams = async () =>
  CHANGELOG_RELEASES.flatMap((release) => [
    { version: release.version },
    { version: release.slug },
  ]);

export const generateMetadata = async ({ params }: ChangelogVersionPageProps): Promise<Metadata> => {
  const { version: raw } = await params;
  const parsed = parseChangelogVersion(raw);
  const t = await getTranslations("changelogPage");

  if (!parsed) {
    return createMetadata({
      title: t("eyebrow"),
      description: t("missing"),
      path: `/changelog/${raw}`,
      noIndex: true,
    });
  }

  const release = getChangelogRelease(parsed.version);
  return createMetadata({
    title: t("meta-title", { version: parsed.version }),
    description: release
      ? t("update-description", { version: parsed.version })
      : t("missing"),
    path: `/changelog/${parsed.version}`,
  });
};

const Page = async ({ params }: ChangelogVersionPageProps) => {
  const { version: raw } = await params;
  const parsed = parseChangelogVersion(raw);
  if (!parsed) notFound();

  return (
    <ChangelogReleaseView
      version={parsed.version}
      release={getChangelogRelease(parsed.version)}
    />
  );
};

export default Page;
