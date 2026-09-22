import { ChangelogReleaseView } from "@/components/changelog/changelog-view";
import { WebPageJsonLd } from "@/components/seo/web-page-json-ld";
import { getChangelogRelease, parseChangelogVersion } from "@/lib/changelog-releases";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type ChangelogVersionPageProps = {
  params: Promise<{ version: string }>
};

export const generateMetadata = async ({ params }: ChangelogVersionPageProps): Promise<Metadata> => {
  const { version: raw } = await params;
  const parsed = parseChangelogVersion(raw);
  const [locale, t] = await Promise.all([getLocale(), getTranslations("changelogPage")]);

  if (!parsed) {
    return createMetadata({
      title: t("eyebrow"),
      description: t("missing"),
      locale,
      path: `/changelog/${raw}`,
      noIndex: true,
    });
  }

  const release = getChangelogRelease(parsed.version, locale);
  return createMetadata({
    title: t("meta-title", { version: parsed.version }),
    description: release
      ? t("update-description", { version: parsed.version })
      : t("missing"),
    locale,
    path: `/changelog/${parsed.version}`,
    noIndex: !release,
    image: release?.banner,
  });
};

const Page = async ({ params }: ChangelogVersionPageProps) => {
  const { version: raw } = await params;
  const parsed = parseChangelogVersion(raw);
  if (!parsed) notFound();

  const [t, locale] = await Promise.all([getTranslations("changelogPage"), getLocale()]);
  const release = getChangelogRelease(parsed.version, locale);

  return (
    <>
      <WebPageJsonLd
        name={t("meta-title", { version: parsed.version })}
        description={release ? t("update-description", { version: parsed.version }) : t("missing")}
        path={`/changelog/${parsed.version}`}
      />
      <ChangelogReleaseView version={parsed.version} release={release} />
    </>
  );
};

export default Page;
